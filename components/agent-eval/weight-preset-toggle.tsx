'use client';

import { WeightPreset } from '@/types';
import { WEIGHT_PRESET_LABELS } from '@/lib/agent-eval/presets';

interface WeightPresetToggleProps {
  preset: WeightPreset;
  onChange: (preset: WeightPreset) => void;
}

const presets: WeightPreset[] = ['developer_trust', 'ship_fast', 'custom'];

export function WeightPresetToggle({ preset, onChange }: WeightPresetToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5">
      {presets.map((option) => {
        const active = preset === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              active ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            {WEIGHT_PRESET_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
