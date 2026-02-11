import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import AgentMessage from '@/models/AgentMessage';
import AgentProfile from '@/models/AgentProfile';
import { checkAgentAccess } from '@/lib/agentAccess';
import { orchestrateAgentRun } from '@/lib/agentOrchestrator';
import { saveMealPlan } from '@/lib/mealPlans';

export const runtime = 'nodejs';

function detectAction(text) {
  const value = String(text || '').toLowerCase();
  const apply = /(apply|save to plan|use this plan|commit plan|put it on my plan)/.test(value);
  if (apply) return 'apply';

  const explicitGenerate = /(generate|make|build|create)/.test(value) && /(plan|meal plan|shopping list|cooking schedule|draft)/.test(value);
  const naturalGenerate = (
    /(plan me|plan for|please plan|meal plan|shopping list|cooking schedule|dinner for|lunch for|breakfast for|snacks? for)/.test(value)
    && /(today|tomorrow|next|week|month|from|to|monday|tuesday|wednesday|thursday|friday|saturday|sunday|daily|each night|every day)/.test(value)
  );
  const shortGenerate = /(can you plan|i need a plan|help me plan)/.test(value);
  const generate = explicitGenerate || naturalGenerate || shortGenerate;
  if (generate) return 'generate';

  const revise = /(revise|change|edit|update|swap|replace)/.test(value) && /(plan|meal|recipe|shopping|schedule)/.test(value);
  if (revise) return 'revise';

  return 'chat';
}

function buildFallbackAssistantReply(text) {
  const value = String(text || '').toLowerCase();
  if (detectAction(value) === 'generate') {
    return 'I can do that. If you have meal-slot or serving preferences, share them now; otherwise I will use defaults and generate the draft.';
  }
  if (/goal|lose|gain|maintain|calorie|macro|protein|budget/.test(value)) {
    return 'Great. Should I generate your plan now? If yes, say: "Generate my plan for this date range."';
  }
  return 'Tell me what you want planned and the date range, and I will take it from there.';
}

function buildPlanningSignalText(messages) {
  return (messages || [])
    .map((message) => String(message?.content || ''))
    .join(' ')
    .toLowerCase();
}

function detectClarifyingQuestions(signalText) {
  const questions = [];

  const hasMealTypeSignal = /(breakfast|lunch|dinner|snack|\b[1-5]\s*(meals?|meal slots?)\b|\b(one|two|three|four|five)\s+meals?\b|\bjust one meal\b)/.test(signalText);
  if (!hasMealTypeSignal) {
    questions.push('Which meal slots should I plan each day: breakfast, lunch, dinner, snack (pick all that apply)?');
  }

  const hasServingSignal = /(\b[1-9]\d?\s*(servings?|portions?)\b|leftovers?|batch cook|meal prep|cook once|reuse)/.test(signalText);
  if (!hasServingSignal) {
    questions.push('Do you want cook-once leftovers (batch prep), and about how many servings per planned meal should I target?');
  }

  return questions;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getNextWeekday(startDate, weekdayIndex) {
  const date = new Date(startDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== weekdayIndex) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function parseDateRangeFromText(text, fallbackRange) {
  const value = String(text || '').toLowerCase();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isoRange = value.match(/from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
  if (isoRange) {
    const start = isoRange[1];
    const end = isoRange[2];
    if (start <= end) {
      return { start, end };
    }
  }

  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const nextWeekdayRange = value.match(
    /from\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+to\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/
  );
  if (nextWeekdayRange) {
    const startDay = weekdayMap[nextWeekdayRange[1]];
    const endDay = weekdayMap[nextWeekdayRange[2]];
    const startDate = getNextWeekday(now, startDay);
    let endDate = getNextWeekday(now, endDay);
    if (endDate < startDate) {
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 7);
    }
    return { start: toIsoDate(startDate), end: toIsoDate(endDate) };
  }

  const simpleWeekdayRange = value.match(
    /\b(?:from\s+)?(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:to|-|through|thru)\s+(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (simpleWeekdayRange) {
    const startDay = weekdayMap[simpleWeekdayRange[1]];
    const endDay = weekdayMap[simpleWeekdayRange[2]];
    const startDate = getNextWeekday(now, startDay);
    let endDate = getNextWeekday(now, endDay);
    if (endDate < startDate) {
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 7);
    }
    return { start: toIsoDate(startDate), end: toIsoDate(endDate) };
  }

  if (/next week/.test(value)) {
    const startDate = getNextWeekday(now, 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return { start: toIsoDate(startDate), end: toIsoDate(endDate) };
  }

  return {
    start: fallbackRange?.start,
    end: fallbackRange?.end
  };
}

async function getAssistantReply({ userText, profile, run }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_AGENT_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return buildFallbackAssistantReply(userText);
  }

  const systemPrompt = [
    'You are MealDino Agent.',
    'Be concise and practical.',
    'You are in chat mode. If the user has not requested an action, ask one concise follow-up question that moves them toward generating or applying a plan.',
    'Do not be verbose.'
  ].join(' ');

  const context = {
    runDateRange: run?.dateRange || null,
    profile: profile
      ? {
          optimizationGoal: profile.optimizationGoal,
          strictness: profile.strictness,
          hardConstraints: profile.hardConstraints || [],
          softPreferences: profile.softPreferences || []
        }
      : null
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'system', content: [{ type: 'input_text', text: `Context: ${JSON.stringify(context)}` }] },
        { role: 'user', content: [{ type: 'input_text', text: userText }] }
      ]
    })
  });

  if (!response.ok) {
    return buildFallbackAssistantReply(userText);
  }

  const payload = await response.json();
  return payload?.output_text?.trim() || buildFallbackAssistantReply(userText);
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return Response.json({ success: false, message: 'Invalid run ID' }, { status: 400 });
    }

    await dbConnect();
    const run = await AgentRun.findOne({ _id: params.id, userId: session.user.id });
    if (!run) {
      return Response.json({ success: false, message: 'Run not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 200)));

    const messages = await AgentMessage.find({ runId: params.id, userId: session.user.id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return Response.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching agent messages:', error);
    return Response.json({ success: false, message: 'Failed to fetch agent messages' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return Response.json({ success: false, message: 'Invalid run ID' }, { status: 400 });
    }

    const body = await request.json();
    const userText = String(body?.content || '').trim();
    if (!userText) {
      return Response.json({ success: false, message: 'Message content is required' }, { status: 400 });
    }

    await dbConnect();

    const run = await AgentRun.findOne({ _id: params.id, userId: session.user.id });
    if (!run) {
      return Response.json({ success: false, message: 'Run not found' }, { status: 404 });
    }

    await AgentMessage.create({
      userId: session.user.id,
      runId: params.id,
      role: 'user',
      content: userText,
      meta: {}
    });

    const profile = await AgentProfile.findOne({ userId: session.user.id });
    const latestAssistantMessage = await AgentMessage.findOne({
      runId: params.id,
      userId: session.user.id,
      role: 'assistant'
    })
      .sort({ createdAt: -1 })
      .lean();

    const baseAction = detectAction(userText);
    const pendingClarification = latestAssistantMessage?.meta?.action === 'clarify';
    const action = baseAction === 'chat' && pendingClarification ? 'generate' : baseAction;
    const recentUserMessages = await AgentMessage.find({
      runId: params.id,
      userId: session.user.id,
      role: 'user'
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    let assistantText = '';
    let assistantMeta = {
      model: process.env.OPENAI_AGENT_MODEL || 'gpt-4o-mini',
      action
    };

    if (action === 'generate' || action === 'revise') {
      const conversationTextForRange = `${userText}\n${recentUserMessages.map((message) => String(message?.content || '')).join('\n')}`;
      const inferredRange = parseDateRangeFromText(conversationTextForRange, run?.dateRange || null);
      if (inferredRange?.start && inferredRange?.end) {
        run.dateRange = inferredRange;
      }

      const signalText = buildPlanningSignalText(recentUserMessages);
      const missingQuestions = detectClarifyingQuestions(signalText);
      const defaultLeftovers = profile?.planPreferences?.leftoversPreference === 'moderate';
      const shouldClarify = action === 'generate' && missingQuestions.length > 0 && defaultLeftovers && !pendingClarification;

      if (shouldClarify) {
        assistantText = [
          'Before I generate, I need 1-2 details to avoid bad assumptions:',
          ...missingQuestions.slice(0, 2).map((question, index) => `${index + 1}. ${question}`)
        ].join('\n');
        assistantMeta = {
          ...assistantMeta,
          action: 'clarify'
        };
      } else {
        const orchestrated = await orchestrateAgentRun({
          userId: session.user.id,
          runId: run._id,
          profile,
          dateRange: run.dateRange,
          revisionInstruction: action === 'revise' ? userText : ''
        });

        run.status = 'draft';
        run.outputDraft = orchestrated.outputDraft;
        run.summary = orchestrated.summary;
        run.errorMessage = '';
        run.approvedAt = null;
        run.appliedAt = null;
        await run.save();

        const days = Array.isArray(orchestrated?.outputDraft?.mealPlanDays) ? orchestrated.outputDraft.mealPlanDays.length : 0;
        const items = Number(orchestrated?.outputDraft?.shoppingList?.totals?.length || 0);
        assistantText = `Done. I generated a ${days}-day draft with ${items} shopping items. Review it below and tell me edits, or say "apply this plan".`;
      }
    } else if (action === 'apply') {
      const violations = Array.isArray(run?.outputDraft?.validation?.hardConstraintViolations)
        ? run.outputDraft.validation.hardConstraintViolations
        : [];
      if (violations.length > 0) {
        assistantText = `I can't apply yet because there are hard-constraint issues: ${violations.join(' | ')}`;
      } else {
        const mealPlanDays = Array.isArray(run?.outputDraft?.mealPlanDays) ? run.outputDraft.mealPlanDays : [];
        if (mealPlanDays.length === 0) {
          assistantText = 'There is no draft plan yet. Say "generate my plan" first.';
        } else {
          for (const day of mealPlanDays) {
            await saveMealPlan(
              day.date,
              session.user.id,
              Array.isArray(day.meals) ? day.meals : [],
              Array.isArray(day.cookingSessions) ? day.cookingSessions : []
            );
          }

          run.status = 'applied';
          run.approvedAt = new Date();
          run.appliedAt = new Date();
          await run.save();
          assistantText = `Applied. I updated ${mealPlanDays.length} day(s) in your plan.`;
        }
      }
    } else {
      assistantText = await getAssistantReply({ userText, profile, run });
    }

    const assistantMessage = await AgentMessage.create({
      userId: session.user.id,
      runId: params.id,
      role: 'assistant',
      content: assistantText,
      meta: assistantMeta
    });

    return Response.json({ success: true, data: assistantMessage }, { status: 201 });
  } catch (error) {
    console.error('Error posting agent message:', error);
    return Response.json({ success: false, message: 'Failed to post agent message' }, { status: 500 });
  }
}
