'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AgentModelSelector } from '@/components/agent-eval/model-selector';
import { ModeToggle } from '@/components/agent-eval/mode-toggle';
import { WeightPresetToggle } from '@/components/agent-eval/weight-preset-toggle';
import { StepTimeline } from '@/components/agent-eval/step-timeline';
import { RunProgress } from '@/components/agent-eval/run-progress';
import { WeightsTable } from '@/components/agent-eval/weights-table';
import { getAgentTask } from '@/lib/agent-eval/tasks';
import { getModelDisplayName } from '@/lib/data/models';
import { useAgentEvalStore } from '@/store/agent-eval-store';
import { useAgentEvalStream } from '@/hooks/use-agent-eval-stream';
import { WEIGHT_PRESETS } from '@/lib/agent-eval/presets';
import { AgentDimensionName } from '@/types';

const STEPS = ['Models', 'Review', 'Run'];

export default function AgentEvalConsole() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const task = getAgentTask(taskId);

  const {
    selectedModels,
    setModels,
    mode,
    setMode,
    weightPreset,
    setWeightPreset,
    customWeights,
    setCustomWeights,
    currentStep,
    setStep,
    nextStep,
    prevStep,
    progress,
    progressUpdate,
    results,
    steps,
    responses,
  } = useAgentEvalStore();

  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const { startStream, stopStream } = useAgentEvalStream({
    onComplete: (completed) => {
      router.push(`/agent-eval/results?runId=${completed.id}`);
    },
  });

  useEffect(() => {
    if (!task) {
      router.push('/agent-eval');
      return;
    }
    setStep(1);
    setCustomWeights(task.customWeights);
  }, [task, router, setStep, setCustomWeights]);

  if (!task) {
    return null;
  }

  const handleRun = async () => {
    setApiKeyError(null);
    try {
      const healthRes = await fetch('/api/health');
      const health = await healthRes.json();
      if (!health.ok) {
        setApiKeyError(health.message);
        return;
      }
    } catch {
      setApiKeyError('Could not verify API keys. Is the server running?');
      return;
    }
    const weights = weightPreset === 'custom' ? customWeights : undefined;
    await startStream(task.id, selectedModels, mode, weightPreset, weights);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/agent-eval');
    } else {
      prevStep();
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      nextStep();
      return;
    }
    if (currentStep === 2) {
      nextStep();
      handleRun();
    }
  };

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const activeWeights = useMemo(() => {
    if (weightPreset === 'custom') return customWeights;
    return WEIGHT_PRESETS[weightPreset];
  }, [weightPreset, customWeights]);

  const weightTotal = useMemo(() => {
    return Object.values(activeWeights).reduce((sum, value) => sum + value, 0);
  }, [activeWeights]);

  const updateWeight = (dimension: AgentDimensionName, value: number) => {
    setCustomWeights({
      ...customWeights,
      [dimension]: value,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="mb-4 text-sm text-gray-400 hover:text-black"
        >
          ← Back to tasks
        </button>
        <h1 className="text-2xl font-semibold text-black">{task.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{task.productQuestion}</p>
      </div>

      {progress.status !== 'running' && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            {STEPS.map((step, index) => (
              <span
                key={step}
                className={`text-sm ${
                  index + 1 === currentStep
                    ? 'font-medium text-black'
                    : index + 1 < currentStep
                      ? 'text-gray-400'
                      : 'text-gray-300'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
          <Progress value={progressPercent} size="sm" />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                Select models
              </h2>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs text-gray-400">Mode</div>
                  <ModeToggle mode={mode} onChange={setMode} />
                </div>
                <div>
                  <div className="mb-2 text-xs text-gray-400">Weight preset</div>
                  <WeightPresetToggle preset={weightPreset} onChange={setWeightPreset} />
                </div>
                <div>
                  <div className="mb-2 text-xs text-gray-400">Models</div>
                  <AgentModelSelector selected={selectedModels} onChange={setModels} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
                  Evaluation summary
                </h2>
                <div className="text-sm text-gray-600">
                  <div>Mode: {mode.replace('_', ' ')}</div>
                  <div>Weight preset: {weightPreset.replace('_', ' ')}</div>
                  <div>
                    Models: {selectedModels.map(getModelDisplayName).join(', ')}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
                  Task prompt
                </h2>
                <p className="text-sm text-gray-600">{task.prompt}</p>
                <div className="mt-4 text-xs text-gray-400">
                  Expected: {task.expectedBehavior}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                  Repo context
                </h2>
                <div className="space-y-4">
                  {task.contextFiles.map((file) => (
                    <div key={file.path} className="rounded-md bg-gray-50 p-4">
                      <div className="mb-2 text-xs text-gray-400">{file.path}</div>
                      <pre className="whitespace-pre-wrap text-xs text-gray-600">
                        {file.content}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

          {currentStep === 3 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                Execution
              </h2>
              <RunProgress
                progress={progressUpdate}
                responses={responses}
                modelIds={selectedModels}
              />
            </div>
          )}

          {mode === 'agent_loop' && steps.length > 0 && currentStep === 3 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                Agent trajectory
              </h2>
              <StepTimeline steps={steps} />
            </div>
          )}

          {results && currentStep === 3 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
                Latest result
              </h2>
              <div className="text-sm text-gray-600">
                Winner: {results.winner} · Weighted score {results.winnerScore.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              Evaluation settings
            </h2>
            <div className="space-y-4 text-sm text-gray-500">
              <div>Mode: {mode.replace('_', ' ')}</div>
              <div>Weight preset: {weightPreset.replace('_', ' ')}</div>
              <div>Models: {selectedModels.length} selected</div>
              {weightPreset === 'custom' ? (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <div className="mb-3 text-xs text-gray-400">
                    Customize weights (total must equal 1.00)
                  </div>
                  <WeightsTable
                    weights={customWeights}
                    editable
                    onChange={updateWeight}
                  />
                </div>
              ) : (
                <div className="pt-1">
                  <WeightsTable weights={activeWeights} />
                </div>
              )}
            </div>
          </div>

          {currentStep < 3 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-2 text-xs text-gray-400">Run evaluation</div>
              <Button
                onClick={handleContinue}
                disabled={
                  selectedModels.length === 0 ||
                  (weightPreset === 'custom' && Math.abs(weightTotal - 1) > 0.01)
                }
              >
                {currentStep === 2 ? 'Start evaluation' : 'Continue'}
              </Button>
              {weightPreset === 'custom' && Math.abs(weightTotal - 1) > 0.01 && (
                <p className="mt-2 text-xs text-amber-600">
                  Custom weights must total 1.00 before continuing.
                </p>
              )}
            </div>
          )}
          {apiKeyError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600">
                API Keys Missing
              </div>
              <p className="text-sm text-amber-800">{apiKeyError}</p>
              <div className="mt-3 rounded-md bg-amber-100 p-3">
                <pre className="text-xs text-amber-700">
{`# Create .env.local in the project root:
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...`}
                </pre>
              </div>
              <p className="mt-2 text-xs text-amber-600">
                After adding keys, restart the dev server.
              </p>
            </div>
          )}
          {progress.status === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-500">{progress.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
