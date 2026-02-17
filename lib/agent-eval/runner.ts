import { v4 as uuidv4 } from 'uuid';
import {
  AgentEvalMode,
  AgentEvaluationResults,
  AgentModelResult,
  AgentTask,
  AgentEvalStep,
  ProgressUpdate,
  WeightPreset,
} from '@/types';
import { queryModel } from '@/lib/models/client';
import { getModelDisplayName, getModelConfig } from '@/lib/data/models';
import { buildSingleShotPrompt, buildStepPrompt } from './prompt';
import { scoreWithPrimaryJudge, scoreWithSecondaryJudge, getCrossFamilyJudgeRole } from './judges';
import { computeAgreement, computeWeightedScore, averageDimensionScores, buildReasoningSummary } from './scoring';
import { WEIGHT_PRESETS } from './presets';
import { saveRun } from '@/lib/runs/storage';

export async function* runAgentEvaluation(
  task: AgentTask,
  modelIds: string[],
  mode: AgentEvalMode,
  weightPreset: WeightPreset,
  customWeights?: Record<string, number>
): AsyncGenerator<{ type: string; data: unknown }> {
  const evaluationId = uuidv4();
  const startedAt = new Date().toISOString();

  const modelResults: Record<string, AgentModelResult> = {};
  const steps: AgentEvalStep[] = [];

  const weights =
    weightPreset === 'custom'
      ? (customWeights as Record<string, number>) || task.customWeights
      : WEIGHT_PRESETS[weightPreset];

  const totalSteps =
    modelIds.length * (mode === 'agent_loop' ? 5 : 1);
  let currentStepIndex = 0;

  const progressBase: ProgressUpdate = {
    currentTest: 1,
    totalTests: totalSteps,
    currentModel: '',
    status: 'querying',
  };

  for (const modelId of modelIds) {
    const displayName = getModelDisplayName(modelId);
    const prompt = buildSingleShotPrompt(task);

    if (mode === 'single_shot') {
      yield {
        type: 'progress',
        data: {
          ...progressBase,
          currentTest: Math.min(currentStepIndex + 1, totalSteps),
          currentModel: displayName,
          status: 'querying',
        },
      };

      const response = await queryModel(modelId, prompt);
      currentStepIndex += 1;
      yield {
        type: 'response',
        data: { modelId, text: response.response || response.error || '' },
      };

      yield {
        type: 'progress',
        data: {
          ...progressBase,
          currentTest: Math.min(currentStepIndex, totalSteps),
          currentModel: 'Evaluator',
          status: 'scoring',
        },
      };

      const primary = await scoreWithPrimaryJudge(task, response.response || response.error || '');
      const secondary = await scoreWithSecondaryJudge(
        task,
        response.response || response.error || ''
      );

      // Cross-family scoring: use the judge from the opposite provider
      // to determine the ranking score, avoiding same-family bias.
      const modelConfig = getModelConfig(modelId);
      const crossFamilyRole = getCrossFamilyJudgeRole(modelConfig?.provider ?? 'openai');
      const rankingScores = crossFamilyRole === 'primary' ? primary : secondary;

      const agreement = computeAgreement(primary, secondary);
      const dimensionAverages = averageDimensionScores(rankingScores);
      const weightedScore = computeWeightedScore(rankingScores, weights);
      const responseText = response.response || response.error || '';
      const reasoningSummary = buildReasoningSummary(rankingScores);

      modelResults[modelId] = {
        modelId,
        displayName,
        response: responseText,
        reasoningSummary,
        primary,
        secondary,
        weightedScore,
        dimensionAverages,
        agreement,
      };
    } else {
      const stepIds: AgentEvalStep['id'][] = [
        'analyze',
        'plan',
        'code',
        'review',
        'final',
      ];

      let priorOutput = '';

      for (const stepId of stepIds) {
        const stepPrompt = buildStepPrompt(task, stepId, priorOutput);

        yield {
          type: 'progress',
          data: {
            ...progressBase,
            currentTest: Math.min(currentStepIndex + 1, totalSteps),
            currentModel: displayName,
            status: 'querying',
          },
        };

        const response = await queryModel(modelId, stepPrompt);
        priorOutput = response.response || response.error || '';
        currentStepIndex += 1;
        yield {
          type: 'response',
          data: { modelId, text: priorOutput, stepId },
        };

        yield {
          type: 'progress',
          data: {
            ...progressBase,
            currentTest: Math.min(currentStepIndex, totalSteps),
            currentModel: 'Evaluator',
            status: 'scoring',
          },
        };

        const primary = await scoreWithPrimaryJudge(
          task,
          priorOutput,
          `Step ${stepId}`
        );
        const secondary = await scoreWithSecondaryJudge(
          task,
          priorOutput,
          `Step ${stepId}`
        );

        const step: AgentEvalStep = {
          modelId,
          id: stepId,
          title: stepId.toUpperCase(),
          prompt: stepPrompt,
          response: priorOutput,
          primaryScores: primary,
          secondaryScores: secondary,
        };

        steps.push(step);
        yield { type: 'step', data: step };
      }

      // Important: select the final step for the current model only.
      // The shared `steps` array includes steps for all models in the run.
      const finalStep = [...steps]
        .reverse()
        .find((s) => s.modelId === modelId && s.id === 'final');
      const finalResponse = finalStep?.response || '';
      const primary = finalStep?.primaryScores || (await scoreWithPrimaryJudge(task, finalResponse));
      const secondary =
        finalStep?.secondaryScores ||
        (await scoreWithSecondaryJudge(task, finalResponse));

      // Cross-family scoring: use the judge from the opposite provider.
      const modelConfig = getModelConfig(modelId);
      const crossFamilyRole = getCrossFamilyJudgeRole(modelConfig?.provider ?? 'openai');
      const rankingScores = crossFamilyRole === 'primary' ? primary : secondary;

      const agreement = computeAgreement(primary, secondary);
      const dimensionAverages = averageDimensionScores(rankingScores);
      const weightedScore = computeWeightedScore(rankingScores, weights);
      const reasoningSummary = buildReasoningSummary(rankingScores);

      modelResults[modelId] = {
        modelId,
        displayName,
        response: finalResponse,
        reasoningSummary,
        primary,
        secondary,
        weightedScore,
        dimensionAverages,
        agreement,
      };
    }
  }

  const sorted = Object.values(modelResults).sort(
    (a, b) => b.weightedScore - a.weightedScore
  );
  const winner = sorted[0];

  const alignmentRates = sorted.map((m) => m.agreement.alignmentRate);
  const alignmentRate =
    alignmentRates.length > 0
      ? alignmentRates.reduce((a, b) => a + b, 0) / alignmentRates.length
      : 0;

  const results: AgentEvaluationResults = {
    id: evaluationId,
    taskId: task.id,
    taskTitle: task.title,
    mode,
    models: modelIds,
    weightPreset,
    startedAt,
    completedAt: new Date().toISOString(),
    modelResults,
    steps: mode === 'agent_loop' ? steps : undefined,
    winner: winner?.modelId || modelIds[0],
    winnerScore: winner?.weightedScore || 0,
    interJudgeAgreement: {
      alignmentRate,
    },
  };

  // Persist the run to disk so it's available on future page loads.
  saveRun(results);

  yield { type: 'complete', data: results };
}
