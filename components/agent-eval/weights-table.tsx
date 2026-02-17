'use client';

import { AgentDimensionName } from '@/types';

interface WeightsTableProps {
  weights: Record<AgentDimensionName, number>;
  editable?: boolean;
  onChange?: (dimension: AgentDimensionName, value: number) => void;
  showTotal?: boolean;
}

const DIMENSIONS: AgentDimensionName[] = [
  'context_utilization',
  'explanation_quality',
  'style_adherence',
  'edge_case_handling',
  'completeness',
  'correctness',
];

export function WeightsTable({
  weights,
  editable = false,
  onChange,
  showTotal = true,
}: WeightsTableProps) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const totalStatus = Math.abs(total - 1) <= 0.01 ? 'text-emerald-600' : 'text-amber-600';

  return (
    <div className="space-y-2">
      {DIMENSIONS.map((dimension) => {
        const value = weights[dimension] ?? 0;
        return (
          <div
            key={dimension}
            className="grid grid-cols-[1fr_auto] items-center gap-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="uppercase tracking-wide text-gray-400">
                  {dimension.replace(/_/g, ' ')}
                </span>
                {!editable && <span className="text-gray-500">{value.toFixed(2)}</span>}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
            </div>
            {editable ? (
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={value}
                onChange={(event) =>
                  onChange?.(dimension, Number(event.target.value))
                }
                className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right text-xs text-gray-600"
              />
            ) : null}
          </div>
        );
      })}
      {showTotal && (
        <div className={`pt-2 text-xs ${totalStatus}`}>
          Total: {total.toFixed(2)}
        </div>
      )}
    </div>
  );
}
