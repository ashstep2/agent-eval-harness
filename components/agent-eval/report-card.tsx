'use client';

import { AgentEvaluationResults } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface ReportCardProps {
  results: AgentEvaluationResults;
}

export function ReportCard({ results }: ReportCardProps) {
  const models = Object.values(results.modelResults).sort(
    (a, b) => b.weightedScore - a.weightedScore
  );
  const winner = models[0];
  const runnerUp = models[1];
  const margin = winner && runnerUp ? (winner.weightedScore - runnerUp.weightedScore).toFixed(2) : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Winner</div>
        <div className="mt-2 text-xl font-semibold text-black">
          {getModelDisplayName(results.winner)}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Score: {results.winnerScore.toFixed(2)} / 5.00
          {margin && Number(margin) > 0 && (
            <span className="ml-2 text-xs text-gray-400">
              (+{margin} vs next)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {models.map((model, i) => {
          const pct = (model.weightedScore / 5) * 100;
          return (
            <div key={model.modelId} className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-black">
                  {i === 0 && <span className="text-xs text-gray-400">1st</span>}
                  {i === 1 && <span className="text-xs text-gray-400">2nd</span>}
                  {i === 2 && <span className="text-xs text-gray-400">3rd</span>}
                  {getModelDisplayName(model.modelId)}
                </span>
                <span className="font-mono text-sm text-gray-600">
                  {model.weightedScore.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full ${i === 0 ? 'bg-black' : 'bg-gray-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Weighted using {results.weightPreset.replace('_', ' ')} preset
      </div>
    </div>
  );
}
