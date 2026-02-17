'use client';

import { AgentModelResult, AgentDimensionName } from '@/types';
import { AGENT_DIMENSIONS, getAgentDimensionDisplayName } from '@/lib/agent-eval/dimensions';

interface RadarChartProps {
  results: Record<string, AgentModelResult>;
  size?: number;
}

const COLORS = ['#3B82F6', '#111827', '#6B7280'];

function polarToCartesian(angle: number, radius: number, center: number) {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function buildPoints(
  values: Record<AgentDimensionName, number>,
  radius: number,
  center: number
) {
  const angleStep = (Math.PI * 2) / AGENT_DIMENSIONS.length;
  return AGENT_DIMENSIONS.map((dim, index) => {
    const value = values[dim.name] || 0;
    const ratio = value / 5;
    const angle = -Math.PI / 2 + index * angleStep;
    const point = polarToCartesian(angle, radius * ratio, center);
    return `${point.x},${point.y}`;
  }).join(' ');
}

export function RadarChart({ results, size = 320 }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.75;
  const modelIds = Object.keys(results);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        {AGENT_DIMENSIONS.map((dim, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AGENT_DIMENSIONS.length;
          const point = polarToCartesian(angle, radius, center);
          return (
            <line
              key={dim.name}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}
        {modelIds.map((modelId, index) => {
          const points = buildPoints(
            results[modelId].dimensionAverages,
            radius,
            center
          );
          return (
            <polygon
              key={modelId}
              points={points}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.12}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
            />
          );
        })}
        {AGENT_DIMENSIONS.map((dim, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AGENT_DIMENSIONS.length;
          const point = polarToCartesian(angle, radius + 14, center);
          return (
            <text
              key={dim.name}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {getAgentDimensionDisplayName(dim.name)}
            </text>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        {modelIds.map((modelId, index) => (
          <div key={modelId} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {results[modelId].displayName}
          </div>
        ))}
      </div>
    </div>
  );
}
