'use client';

import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading';
import { getModelDisplayName } from '@/lib/data/models';
import { ProgressUpdate } from '@/types';

interface RunProgressProps {
  progress: ProgressUpdate | null;
  responses: Record<string, { text: string; stepId?: string }>;
  modelIds: string[];
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function buildStatusLabel(progress: ProgressUpdate | null): string {
  if (!progress) return 'Preparing evaluation...';
  const model = progress.currentModel;
  if (progress.status === 'complete') return 'Evaluation complete';
  if (progress.status === 'scoring') return model ? `Scoring ${model}...` : 'Scoring responses...';
  return model ? `Querying ${model}...` : 'Running evaluation...';
}

type ModelPhase = 'waiting' | 'querying' | 'scoring' | 'done';

function getModelPhase(
  modelId: string,
  progress: ProgressUpdate | null,
  hasResponse: boolean
): ModelPhase {
  if (!progress) return 'waiting';
  const displayName = getModelDisplayName(modelId);
  const isCurrent = progress.currentModel === displayName;
  if (isCurrent && progress.status === 'scoring') return 'scoring';
  if (isCurrent && progress.status === 'querying') return 'querying';
  if (progress.status === 'complete') return 'done';
  if (hasResponse) return 'done';
  return 'waiting';
}

const PHASE_STYLES: Record<ModelPhase, { border: string; bg: string; label: string }> = {
  waiting: { border: 'border-gray-200', bg: 'bg-white', label: 'Waiting' },
  querying: { border: 'border-blue-300', bg: 'bg-blue-50/50', label: 'Generating response...' },
  scoring: { border: 'border-amber-300', bg: 'bg-amber-50/50', label: 'Being scored by judge...' },
  done: { border: 'border-emerald-300', bg: 'bg-emerald-50/30', label: 'Complete' },
};

export function RunProgress({ progress, responses, modelIds }: RunProgressProps) {
  const startTimeRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Elapsed stopwatch — start once when first progress event arrives
  const timerStarted = useRef(false);
  useEffect(() => {
    if (!progress || timerStarted.current) return;
    timerStarted.current = true;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [progress]);

  // Event-driven progress: use currentTest/totalTests from SSE
  const eventPercent = progress
    ? progress.status === 'complete'
      ? 100
      : Math.round(((progress.currentTest - 1) / Math.max(1, progress.totalTests)) * 100)
    : 0;

  const statusLabel = buildStatusLabel(progress);
  const stepLabel = progress
    ? `Step ${progress.currentTest} of ${progress.totalTests}`
    : '';

  return (
    <div className="space-y-5">
      {/* Status + step counter */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress && progress.status !== 'complete' && (
              <LoadingSpinner size="sm" />
            )}
            <span className="text-sm font-medium text-gray-700">{statusLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            {stepLabel && (
              <span className="text-xs font-medium text-gray-500">{stepLabel}</span>
            )}
            <span className="font-mono text-xs text-gray-400">
              {formatElapsed(elapsed)}
            </span>
          </div>
        </div>
        <Progress value={eventPercent} />
      </div>

      {/* Model panels */}
      <div className="space-y-3">
        {modelIds.map((modelId) => {
          const response = responses[modelId];
          const phase = getModelPhase(modelId, progress, !!response?.text);
          const style = PHASE_STYLES[phase];
          const isActive = phase === 'querying' || phase === 'scoring';

          return (
            <div
              key={modelId}
              className={`rounded-lg border p-4 transition-colors duration-300 ${style.border} ${style.bg}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isActive && <LoadingSpinner size="sm" />}
                  {phase === 'done' && (
                    <span className="text-emerald-500">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <span className="text-sm font-medium text-black">
                    {getModelDisplayName(modelId)}
                  </span>
                </div>
                <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                  {style.label}
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto overflow-x-hidden">
                {response?.text ? (
                  <pre className="whitespace-pre-wrap break-words text-xs text-gray-600">
                    {response.text}
                  </pre>
                ) : (
                  <span className="text-xs text-gray-400">
                    {phase === 'waiting' ? 'Waiting for turn...' : 'Generating...'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
