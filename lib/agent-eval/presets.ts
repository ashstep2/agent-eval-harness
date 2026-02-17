import { WeightPreset, AgentDimensionName } from '@/types';

export const WEIGHT_PRESETS: Record<
  WeightPreset,
  Record<AgentDimensionName, number>
> = {
  developer_trust: {
    context_utilization: 0.25,
    explanation_quality: 0.25,
    style_adherence: 0.2,
    edge_case_handling: 0.15,
    completeness: 0.1,
    correctness: 0.05,
  },
  ship_fast: {
    correctness: 0.3,
    completeness: 0.25,
    edge_case_handling: 0.2,
    style_adherence: 0.1,
    context_utilization: 0.1,
    explanation_quality: 0.05,
  },
  custom: {
    correctness: 0,
    completeness: 0,
    edge_case_handling: 0,
    style_adherence: 0,
    context_utilization: 0,
    explanation_quality: 0,
  },
};

export const WEIGHT_PRESET_LABELS: Record<WeightPreset, string> = {
  developer_trust: 'Developer Trust',
  ship_fast: 'Ship Fast',
  custom: 'Custom',
};
