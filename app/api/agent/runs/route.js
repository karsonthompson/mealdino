import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentProfile from '@/models/AgentProfile';
import AgentRun from '@/models/AgentRun';
import AgentMessage from '@/models/AgentMessage';
import { checkAgentAccess } from '@/lib/agentAccess';

export const runtime = 'nodejs';

function normalizeDateString(value, fallback) {
  const raw = String(value || fallback || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

function getDefaultRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 6);
  const toDate = (d) => d.toISOString().slice(0, 10);
  return { start: toDate(start), end: toDate(end) };
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));

    await dbConnect();
    const runs = await AgentRun.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return Response.json({ success: true, data: runs });
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    return Response.json({ success: false, message: 'Failed to fetch agent runs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    const defaults = getDefaultRange();
    const body = await request.json().catch(() => ({}));
    const start = normalizeDateString(body?.dateRange?.start, defaults.start);
    const end = normalizeDateString(body?.dateRange?.end, defaults.end);
    const overwriteExistingDays = body?.overwriteExistingDays !== false;

    await dbConnect();

    const profile = await AgentProfile.findOne({ userId: session.user.id }).lean();
    const run = await AgentRun.create({
      userId: session.user.id,
      profileId: profile?._id || null,
      model: 'gpt-4o-mini',
      status: 'draft',
      dateRange: { start, end },
      overwriteExistingDays,
      inputSnapshot: {
        profile: profile || null
      },
      summary: {
        whyThisPlan: 'Draft created. Share your preferences in chat, then generate a plan.',
        unmetConstraints: [],
        notes: []
      }
    });

    await AgentMessage.create({
      userId: session.user.id,
      runId: run._id,
      role: 'system',
      content: 'Agent run initialized. Provide user goals and constraints before generation.',
      meta: {}
    });

    return Response.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent run:', error);
    return Response.json({ success: false, message: 'Failed to create agent run' }, { status: 500 });
  }
}
