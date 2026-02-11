import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import AgentProfile from '@/models/AgentProfile';
import AgentMessage from '@/models/AgentMessage';
import { checkAgentAccess } from '@/lib/agentAccess';
import { orchestrateAgentRun } from '@/lib/agentOrchestrator';

export const runtime = 'nodejs';

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

    const body = await request.json().catch(() => ({}));
    const instruction = String(body?.instruction || '').trim();
    if (!instruction) {
      return Response.json({ success: false, message: 'Revision instruction is required' }, { status: 400 });
    }

    await dbConnect();
    const run = await AgentRun.findOne({ _id: params.id, userId: session.user.id });
    if (!run) {
      return Response.json({ success: false, message: 'Run not found' }, { status: 404 });
    }

    await AgentMessage.create({
      userId: session.user.id,
      runId: run._id,
      role: 'user',
      content: instruction,
      meta: {
        event: 'revision_request'
      }
    });

    const profile = await AgentProfile.findOne({ userId: session.user.id });
    const orchestrated = await orchestrateAgentRun({
      userId: session.user.id,
      runId: run._id,
      profile,
      dateRange: run.dateRange,
      revisionInstruction: instruction
    });

    run.status = 'draft';
    run.outputDraft = orchestrated.outputDraft;
    run.summary = orchestrated.summary;
    run.errorMessage = '';
    await run.save();

    await AgentMessage.create({
      userId: session.user.id,
      runId: run._id,
      role: 'assistant',
      content: `Revision applied. ${orchestrated.summary?.whyThisPlan || 'Updated draft ready for review.'}`,
      meta: {
        event: 'revision_applied'
      }
    });

    return Response.json({ success: true, data: run });
  } catch (error) {
    console.error('Error revising agent run:', error);
    return Response.json({ success: false, message: 'Failed to revise run' }, { status: 500 });
  }
}
