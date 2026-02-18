'use client';

import { MODELS } from '@/lib/data/models';

interface ModelSelectorProps {
  selected: string[];
  onChange: (models: string[]) => void;
}

/** CLI-type models (e.g. Codex) can only run locally — disable on deployed sites. */
function isCliDisabled(type?: 'api' | 'cli'): boolean {
  if (type !== 'cli') return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

export function AgentModelSelector({ selected, onChange }: ModelSelectorProps) {
  const toggle = (modelId: string) => {
    const isSelected = selected.includes(modelId);
    if (isSelected) {
      onChange(selected.filter((id) => id !== modelId));
    } else if (selected.length < 3) {
      onChange([...selected, modelId]);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODELS.map((model) => {
        const disabled = isCliDisabled(model.type);
        const isSelected = !disabled && selected.includes(model.modelId);
        return (
          <button
            key={model.modelId}
            onClick={() => !disabled && toggle(model.modelId)}
            disabled={disabled}
            className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
              disabled
                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                : isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div>
              <div className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-black'}`}>
                {model.displayName}
              </div>
              <div className="text-xs text-gray-500">
                {disabled
                  ? 'Requires local Codex CLI -- clone the repo to test'
                  : model.description}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs ${isSelected ? 'text-black' : 'text-gray-400'}`}
              >
                {model.provider}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
