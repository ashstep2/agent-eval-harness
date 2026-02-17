'use client';

import { AgentEvaluationSummary } from '@/types';

interface TaskStatsProps {
  totalTasks: number;
  recentRuns: AgentEvaluationSummary[];
}

export function TaskStats({ totalTasks, recentRuns }: TaskStatsProps) {
  const avgScore =
    recentRuns.length > 0
      ? recentRuns.reduce((sum, run) => sum + run.winnerScore, 0) / recentRuns.length
      : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-xs uppercase text-gray-400">Tasks</div>
        <div className="mt-2 text-2xl font-semibold text-black">{totalTasks}</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-xs uppercase text-gray-400">Demo runs</div>
        <div className="mt-2 text-2xl font-semibold text-black">{recentRuns.length}</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-xs uppercase text-gray-400">Avg winner score</div>
        <div className="mt-2 text-2xl font-semibold text-black">
          {avgScore.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
