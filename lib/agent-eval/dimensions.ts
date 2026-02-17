import { AgentEvalDimension, AgentDimensionName } from '@/types';

export const AGENT_DIMENSIONS: AgentEvalDimension[] = [
  {
    name: 'correctness',
    displayName: 'Correctness',
    description: 'Does the code work and solve the problem as specified?',
  },
  {
    name: 'style_adherence',
    displayName: 'Style Adherence',
    description: 'Follows existing repo conventions and patterns.',
  },
  {
    name: 'context_utilization',
    displayName: 'Context Utilization',
    description: 'Uses existing code, types, and context appropriately.',
  },
  {
    name: 'completeness',
    displayName: 'Completeness',
    description: 'Fully addresses the requested scope without gaps.',
  },
  {
    name: 'explanation_quality',
    displayName: 'Explanation Quality',
    description: 'Explanation enables developer verification and trust.',
  },
  {
    name: 'edge_case_handling',
    displayName: 'Edge Case Handling',
    description: 'Handles edge cases for production readiness.',
  },
];

export const AGENT_DIMENSION_MAP: Record<AgentDimensionName, AgentEvalDimension> =
  AGENT_DIMENSIONS.reduce(
    (acc, dim) => {
      acc[dim.name] = dim;
      return acc;
    },
    {} as Record<AgentDimensionName, AgentEvalDimension>
  );

export function getAgentDimensionDisplayName(name: AgentDimensionName): string {
  return AGENT_DIMENSION_MAP[name]?.displayName || name;
}

export function getAgentDimensionDescription(name: AgentDimensionName): string {
  return AGENT_DIMENSION_MAP[name]?.description || '';
}
