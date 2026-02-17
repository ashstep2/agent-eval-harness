import { AgentEvalMode, WeightPreset } from '@/types';

export interface AgentEvaluationConfig {
  taskId: string;
  models: string[];
  mode: AgentEvalMode;
  weightPreset: WeightPreset;
  customWeights?: Record<string, number>;
  startedAt: string;
}

const globalForConfigs = globalThis as unknown as {
  agentEvaluationConfigs?: Map<string, AgentEvaluationConfig>;
};

const agentEvaluationConfigs =
  globalForConfigs.agentEvaluationConfigs ?? new Map<string, AgentEvaluationConfig>();

globalForConfigs.agentEvaluationConfigs = agentEvaluationConfigs;

export function setAgentEvaluationConfig(
  evaluationId: string,
  config: AgentEvaluationConfig
) {
  agentEvaluationConfigs.set(evaluationId, config);
}

export function getAgentEvaluationConfig(evaluationId: string) {
  return agentEvaluationConfigs.get(evaluationId);
}

export function deleteAgentEvaluationConfig(evaluationId: string) {
  agentEvaluationConfigs.delete(evaluationId);
}
