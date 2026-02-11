import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import { checkAgentAccess } from '@/lib/agentAccess';

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

    const violations = Array.isArray(run?.outputDraft?.validation?.hardConstraintViolations)
      ? run.outputDraft.validation.hardConstraintViolations
      : [];
    if (violations.length > 0) {
      return Response.json(
        {
          success: false,
          message: 'Run has unmet hard constraints. Revise before approving.',
          data: { violations }
        },
        { status: 400 }
      );
    }

    run.status = 'approved';
    run.approvedAt = new Date();
    await run.save();

    return Response.json({ success: true, data: run });
  } catch (error) {
    console.error('Error approving agent run:', error);
    return Response.json({ success: false, message: 'Failed to approve run' }, { status: 500 });
  }
}
