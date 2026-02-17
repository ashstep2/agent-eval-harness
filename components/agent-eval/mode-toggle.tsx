'use client';

import { AgentEvalMode } from '@/types';

interface ModeToggleProps {
  mode: AgentEvalMode;
  onChange: (mode: AgentEvalMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5">
      {[
        { id: 'single_shot', label: 'Single-Shot' },
        { id: 'agent_loop', label: 'Agent Loop (Beta)' },
      ].map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id as AgentEvalMode)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              active ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
