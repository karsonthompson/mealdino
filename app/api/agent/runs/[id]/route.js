import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentRun from '@/models/AgentRun';
import AgentMessage from '@/models/AgentMessage';
import { checkAgentAccess } from '@/lib/agentAccess';

export const runtime = 'nodejs';

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
    const run = await AgentRun.findOne({ _id: params.id, userId: session.user.id }).lean();

    if (!run) {
      return Response.json({ success: false, message: 'Run not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get('includeMessages') === 'true';
    const responseData = { run };

    if (includeMessages) {
      const messages = await AgentMessage.find({ runId: params.id, userId: session.user.id })
        .sort({ createdAt: 1 })
        .lean();
      responseData.messages = messages;
    }

    return Response.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching agent run:', error);
    return Response.json({ success: false, message: 'Failed to fetch agent run' }, { status: 500 });
  }
}
