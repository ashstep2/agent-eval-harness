'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskCard } from '@/components/agent-eval/task-card';
import { TaskStats } from '@/components/agent-eval/task-stats';
import { AGENT_TASKS } from '@/lib/agent-eval/tasks';
import { useAgentEvalStore } from '@/store/agent-eval-store';
import { getModelDisplayName } from '@/lib/data/models';

export default function AgentEvalDashboard() {
  const router = useRouter();
  const { setTask, recentEvaluations, loadRuns } = useAgentEvalStore();

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const handleSelect = (taskId: string) => {
    setTask(taskId);
    router.push(`/agent-eval/${taskId}`);
  };

  return (
    <div className="mx-auto max-w-container px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-black">
          Coding Agent Eval
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Benchmark trust, completeness, and production readiness for coding agents.
        </p>
      </div>

      <div className="mb-12">
        <TaskStats totalTasks={AGENT_TASKS.length} recentRuns={recentEvaluations} />
      </div>

      {/* Recent Evaluations */}
      <section className="mb-16">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
          Recent evaluations
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Models</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Preset</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Winner</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Score</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEvaluations.map((run) => (
                <tr
                  key={run.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/agent-eval/results?runId=${run.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-black">
                    {run.taskTitle}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {run.models.map(getModelDisplayName).join(' vs ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {run.weightPreset.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-black">
                    {getModelDisplayName(run.winner)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">
                    {run.winnerScore.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-blue-600">
                    View →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Task Library */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Task library
        </h2>
        <span className="text-sm text-gray-400">
          {AGENT_TASKS.length} tasks
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_TASKS.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
