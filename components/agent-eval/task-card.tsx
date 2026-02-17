'use client';

import { AgentTask } from '@/types';

interface TaskCardProps {
  task: AgentTask;
  onSelect: (id: string) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  return (
    <button
      onClick={() => onSelect(task.id)}
      className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 text-left transition-colors hover:border-gray-400"
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            {task.category} · {task.difficulty}
          </span>
          <span className="text-xs text-gray-400">{task.id}</span>
        </div>
        <h3 className="text-base font-medium text-black">{task.title}</h3>
        <p className="mt-2 text-sm text-gray-500">{task.productQuestion}</p>
      </div>
      <div className="mt-6 text-sm text-blue-600">Open task →</div>
    </button>
  );
}
