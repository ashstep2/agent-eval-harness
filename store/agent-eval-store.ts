'use client';

import { create } from 'zustand';
import {
  AgentEvaluationResults,
  AgentEvaluationSummary,
  AgentDimensionName,
  AgentEvalMode,
  WeightPreset,
  AgentEvalStep,
  ProgressUpdate,
} from '@/types';
import { DEFAULT_HEAD_TO_HEAD_MODEL_IDS } from '@/lib/data/models';

function toSummary(run: AgentEvaluationResults): AgentEvaluationSummary {
  return {
    id: run.id,
    taskId: run.taskId,
    taskTitle: run.taskTitle,
    mode: run.mode,
    models: run.models,
    winner: run.winner,
    winnerScore: run.winnerScore,
    completedAt: run.completedAt,
    weightPreset: run.weightPreset,
  };
}

interface AgentEvalState {
  // Selection
  selectedTaskId: string | null;
  selectedModels: string[];
  mode: AgentEvalMode;
  weightPreset: WeightPreset;
  currentStep: number;
  customWeights: Record<AgentDimensionName, number>;

  // Runtime
  progress: { status: 'idle' | 'running' | 'complete' | 'error'; message?: string };
  progressUpdate: ProgressUpdate | null;
  steps: AgentEvalStep[];
  responses: Record<string, { text: string; stepId?: string }>;
  results: AgentEvaluationResults | null;

  // Persisted runs (loaded from /api/runs)
  savedRuns: AgentEvaluationResults[];
  recentEvaluations: AgentEvaluationSummary[];
  runsLoaded: boolean;

  // Actions — selection
  setTask: (taskId: string | null) => void;
  setModels: (models: string[]) => void;
  setMode: (mode: AgentEvalMode) => void;
  setWeightPreset: (preset: WeightPreset) => void;
  setCustomWeights: (weights: Record<AgentDimensionName, number>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Actions — run lifecycle
  startEvaluation: () => void;
  updateProgress: (progress: ProgressUpdate) => void;
  addResponse: (modelId: string, text: string, stepId?: string) => void;
  addStep: (step: AgentEvalStep) => void;
  completeEvaluation: (results: AgentEvaluationResults) => void;
  failEvaluation: (message: string) => void;

  // Actions — persistence
  loadRuns: () => Promise<void>;
}

export const useAgentEvalStore = create<AgentEvalState>((set, get) => ({
  selectedTaskId: null,
  selectedModels: [...DEFAULT_HEAD_TO_HEAD_MODEL_IDS],
  mode: 'single_shot',
  weightPreset: 'developer_trust',
  currentStep: 1,
  customWeights: {
    correctness: 0.2,
    completeness: 0.15,
    context_utilization: 0.25,
    explanation_quality: 0.15,
    style_adherence: 0.15,
    edge_case_handling: 0.1,
  },

  progress: { status: 'idle' },
  progressUpdate: null,
  steps: [],
  responses: {},
  results: null,

  savedRuns: [],
  recentEvaluations: [],
  runsLoaded: false,

  setTask: (taskId) => set({ selectedTaskId: taskId }),
  setModels: (models) => set({ selectedModels: models }),
  setMode: (mode) => set({ mode }),
  setWeightPreset: (preset) => set({ weightPreset: preset }),
  setCustomWeights: (weights) => set({ customWeights: weights }),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  startEvaluation: () =>
    set({
      progress: { status: 'running' },
      progressUpdate: null,
      steps: [],
      responses: {},
      results: null,
    }),

  updateProgress: (progress) => set({ progressUpdate: progress }),

  addResponse: (modelId, text, stepId) =>
    set((state) => ({
      responses: { ...state.responses, [modelId]: { text, stepId } },
    })),

  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),

  completeEvaluation: (results) =>
    set((state) => ({
      progress: { status: 'complete' },
      results,
      savedRuns: [results, ...state.savedRuns],
      recentEvaluations: [toSummary(results), ...state.recentEvaluations],
    })),

  failEvaluation: (message) => set({ progress: { status: 'error', message } }),

  loadRuns: async () => {
    // Only fetch once per session.
    if (get().runsLoaded) return;

    try {
      const res = await fetch('/api/runs');
      if (!res.ok) return;
      const runs: AgentEvaluationResults[] = await res.json();
      set({
        savedRuns: runs,
        recentEvaluations: runs.map(toSummary),
        runsLoaded: true,
      });
    } catch {
      // Silently fail — pages will show empty state.
    }
  },
}));
