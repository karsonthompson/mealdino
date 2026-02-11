import { auth } from '@/auth';
import { checkAgentAccess } from '@/lib/agentAccess';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
    const model = process.env.OPENAI_AGENT_MODEL || 'gpt-4o-mini';

    return Response.json({
      success: true,
      data: {
        llmConnected: hasOpenAIKey,
        mode: hasOpenAIKey ? 'llm' : 'fallback',
        model
      }
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return Response.json({ success: false, message: 'Failed to fetch agent status' }, { status: 500 });
  }
}
