import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import { checkAgentAccess } from '@/lib/agentAccess';
import { buildShoppingList } from '@/lib/shoppingList';
import { validateAgentDraft } from '@/lib/agentValidation';
import { saveMealPlan } from '@/lib/mealPlans';

export const runtime = 'nodejs';

function normalizeMealDays(inputDays) {
  if (!Array.isArray(inputDays)) return [];

  return inputDays
    .map((day) => ({
      date: String(day?.date || ''),
      meals: Array.isArray(day?.meals)
        ? day.meals
            .map((meal) => ({
              type: ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal?.type) ? meal.type : 'lunch',
              recipe: String(meal?.recipe || ''),
              notes: String(meal?.notes || 'Agent-edited draft'),
              source: ['fresh', 'leftovers', 'meal_prep', 'frozen'].includes(meal?.source) ? meal.source : 'fresh',
              plannedServings: Number.isFinite(Number(meal?.plannedServings))
                ? Math.min(4, Math.max(1, Number(meal.plannedServings)))
                : 1,
              excludeFromShopping: meal?.excludeFromShopping === true
            }))
            .filter((meal) => meal.recipe)
        : [],
      cookingSessions: Array.isArray(day?.cookingSessions)
        ? day.cookingSessions
            .map((session) => ({
              recipe: String(session?.recipe || ''),
              notes: String(session?.notes || 'Agent-edited prep'),
              timeSlot: ['morning', 'afternoon', 'evening'].includes(session?.timeSlot) ? session.timeSlot : 'afternoon',
              servings: Number.isFinite(Number(session?.servings))
                ? Math.min(20, Math.max(1, Number(session.servings)))
                : 1,
              plannedServings: Number.isFinite(Number(session?.plannedServings))
                ? Math.min(20, Math.max(1, Number(session.plannedServings)))
                : (Number.isFinite(Number(session?.servings)) ? Math.min(20, Math.max(1, Number(session.servings))) : 1),
              purpose: ['meal_prep', 'batch_cooking', 'weekly_prep', 'daily_cooking'].includes(session?.purpose)
                ? session.purpose
                : 'meal_prep',
              excludeFromShopping: session?.excludeFromShopping === true
            }))
            .filter((session) => session.recipe)
        : []
    }))
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date));
}

export async function PUT(request, { params }) {
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
    const nextMealPlanDays = normalizeMealDays(body?.mealPlanDays);
    const applyToPlan = body?.applyToPlan !== false;
    if (nextMealPlanDays.length === 0) {
      return Response.json({ success: false, message: 'mealPlanDays is required' }, { status: 400 });
    }

    await dbConnect();
    const run = await AgentRun.findOne({ _id: params.id, userId: session.user.id });
    if (!run) {
      return Response.json({ success: false, message: 'Run not found' }, { status: 404 });
    }

    const recipeCatalog = Array.isArray(run?.outputDraft?.recipeCatalog) ? run.outputDraft.recipeCatalog : [];
    const recipeMap = new Map(recipeCatalog.map((recipe) => [String(recipe._id), recipe]));

    const normalizedDays = nextMealPlanDays.map((day) => ({
      ...day,
      meals: day.meals.filter((meal) => recipeMap.has(String(meal.recipe))),
      cookingSessions: (day.cookingSessions || []).filter((session) => recipeMap.has(String(session.recipe)))
    }));

    const populatedDays = normalizedDays.map((day) => ({
      date: day.date,
      meals: day.meals.map((meal) => ({
        ...meal,
        recipe: recipeMap.get(String(meal.recipe))
      })),
      cookingSessions: (day.cookingSessions || []).map((session) => ({
        ...session,
        recipe: recipeMap.get(String(session.recipe))
      }))
    }));

    const shoppingDraft = buildShoppingList(populatedDays, {
      includeMeals: true,
      includeCookingSessions: true
    });
    const validation = validateAgentDraft(
      { hardConstraints: run?.inputSnapshot?.profile?.hardConstraints || [], medicalDisclaimerAcceptedAt: run?.inputSnapshot?.profile?.medicalDisclaimerAcceptedAt || null },
      recipeCatalog
    );

    run.status = applyToPlan ? 'applied' : 'draft';
    run.approvedAt = applyToPlan ? new Date() : null;
    run.appliedAt = applyToPlan ? new Date() : null;
    run.outputDraft = {
      ...run.outputDraft,
      mealPlanDays: normalizedDays,
      shoppingList: shoppingDraft,
      validation
    };
    run.summary = {
      ...(run.summary || {}),
      notes: Array.isArray(run?.summary?.notes) ? run.summary.notes : []
    };
    await run.save();

    if (applyToPlan) {
      for (const day of normalizedDays) {
        await saveMealPlan(
          day.date,
          session.user.id,
          Array.isArray(day.meals) ? day.meals : [],
          Array.isArray(day.cookingSessions) ? day.cookingSessions : []
        );
      }
    }

    return Response.json({
      success: true,
      data: run,
      meta: {
        appliedToPlan: applyToPlan,
        appliedDays: applyToPlan ? normalizedDays.length : 0
      }
    });
  } catch (error) {
    console.error('Error updating draft meal plan:', error);
    return Response.json({ success: false, message: 'Failed to update draft' }, { status: 500 });
  }
}
