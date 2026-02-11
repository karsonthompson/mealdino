import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import { checkAgentAccess } from '@/lib/agentAccess';
import { saveMealPlan } from '@/lib/mealPlans';

export const runtime = 'nodejs';

export async function POST(_request, { params }) {
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

    if (run.status !== 'approved') {
      return Response.json(
        { success: false, message: 'Run must be approved before apply.' },
        { status: 400 }
      );
    }

    const violations = Array.isArray(run?.outputDraft?.validation?.hardConstraintViolations)
      ? run.outputDraft.validation.hardConstraintViolations
      : [];
    if (violations.length > 0) {
      return Response.json(
        {
          success: false,
          message: 'Run has unmet hard constraints. Revise before applying.',
          data: { violations }
        },
        { status: 400 }
      );
    }

    const mealPlanDays = Array.isArray(run?.outputDraft?.mealPlanDays) ? run.outputDraft.mealPlanDays : [];
    if (mealPlanDays.length === 0) {
      return Response.json({ success: false, message: 'Run has no generated meal plan days to apply' }, { status: 400 });
    }

    for (const day of mealPlanDays) {
      await saveMealPlan(
        day.date,
        session.user.id,
        Array.isArray(day.meals) ? day.meals : [],
        Array.isArray(day.cookingSessions) ? day.cookingSessions : []
      );
    }

    run.status = 'applied';
    run.appliedAt = new Date();
    await run.save();

    return Response.json({
      success: true,
      data: {
        runId: run._id,
        appliedDays: mealPlanDays.length
      }
    });
  } catch (error) {
    console.error('Error applying agent run:', error);
    return Response.json({ success: false, message: 'Failed to apply run' }, { status: 500 });
  }
}
