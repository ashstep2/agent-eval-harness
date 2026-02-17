'use client';

import { AgentEvalStep } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface StepTimelineProps {
  steps: AgentEvalStep[];
}

export function StepTimeline({ steps }: StepTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-xs uppercase text-gray-400">
            <span>{step.title}</span>
            {step.modelId ? (
              <span className="text-gray-300">{getModelDisplayName(step.modelId)}</span>
            ) : null}
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-600">
            {step.response}
          </pre>
        </div>
      ))}
    </div>
  );
}
