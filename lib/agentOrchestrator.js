import { runAgentPlanningTools } from '@/lib/agentTools';

export async function orchestrateAgentRun({
  userId,
  runId,
  profile,
  dateRange,
  revisionInstruction
}) {
  const result = await runAgentPlanningTools({
    userId,
    runId,
    profile,
    dateRange,
    revisionInstruction
  });

  return result;
}
