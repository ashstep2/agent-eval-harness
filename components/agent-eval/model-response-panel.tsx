'use client';

import { useState } from 'react';
import { AgentEvaluationResults, AgentModelResult } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface ModelResponsePanelProps {
  results: AgentEvaluationResults;
}

function getResponseExcerpt(response: string, maxChars = 280): string {
  const normalized = response.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

function ReasoningBadges({ model }: { model: AgentModelResult }) {
  if (!model.reasoningSummary) return null;

  const strengths: { dimension: string; score: number; reasoning: string }[] = [];
  const weaknesses: { dimension: string; score: number; reasoning: string }[] = [];
  const mid: { dimension: string; score: number; reasoning: string }[] = [];

  // Use the ranking judge's scores (already stored in dimensionAverages)
  // but we need the per-dimension reasoning from the judge that produced the
  // dimensionAverages. We can infer which judge by checking if dimensionAverages
  // matches primary or secondary scores.
  const rankingJudge = (() => {
    const firstDim = model.primary.dimensionScores[0];
    if (!firstDim) return model.primary;
    const avg = model.dimensionAverages[firstDim.dimension];
    return avg === firstDim.score ? model.primary : model.secondary;
  })();

  for (const dim of rankingJudge.dimensionScores) {
    const entry = {
      dimension: dim.dimension.replace(/_/g, ' '),
      score: dim.score,
      reasoning: dim.reasoning,
    };
    if (dim.score >= 4) strengths.push(entry);
    else if (dim.score <= 2) weaknesses.push(entry);
    else mid.push(entry);
  }

  return (
    <div className="space-y-3">
      {strengths.length > 0 && (
        <div>
          <span className="mb-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Strengths
          </span>
          <ul className="mt-1 space-y-1">
            {strengths.map((s) => (
              <li key={s.dimension} className="text-sm leading-relaxed text-gray-600">
                <span className="font-medium capitalize text-gray-900">{s.dimension}</span>
                <span className="ml-1 text-xs text-gray-400">({s.score}/5)</span>
                <span className="ml-1 text-gray-400">&mdash;</span> {s.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div>
          <span className="mb-1.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Weaknesses
          </span>
          <ul className="mt-1 space-y-1">
            {weaknesses.map((s) => (
              <li key={s.dimension} className="text-sm leading-relaxed text-gray-600">
                <span className="font-medium capitalize text-gray-900">{s.dimension}</span>
                <span className="ml-1 text-xs text-gray-400">({s.score}/5)</span>
                <span className="ml-1 text-gray-400">&mdash;</span> {s.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mid.length > 0 && (
        <div>
          <span className="mb-1.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Mixed
          </span>
          <ul className="mt-1 space-y-1">
            {mid.map((s) => (
              <li key={s.dimension} className="text-sm leading-relaxed text-gray-600">
                <span className="font-medium capitalize text-gray-900">{s.dimension}</span>
                <span className="ml-1 text-xs text-gray-400">({s.score}/5)</span>
                <span className="ml-1 text-gray-400">&mdash;</span> {s.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, rank }: { model: AgentModelResult; rank: number }) {
  const [showResponse, setShowResponse] = useState(false);
  const hasResponse = !!model.response;
  const hasReasoning = !!model.reasoningSummary;
  const excerpt = hasResponse ? getResponseExcerpt(model.response) : '';

  if (!hasResponse && !hasReasoning) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{rank === 0 ? '1st' : '2nd'}</span>
          <span className="text-sm font-semibold text-black">
            {getModelDisplayName(model.modelId)}
          </span>
          <span className="font-mono text-sm text-gray-400">
            {model.weightedScore.toFixed(2)}
          </span>
        </div>
      </div>

      {hasReasoning && <ReasoningBadges model={model} />}

      {hasResponse && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
            {excerpt}
          </div>
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <span className="inline-block transition-transform" style={{ transform: showResponse ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              &#9654;
            </span>
            {showResponse ? 'Hide full response' : 'Show full response'}
          </button>
          {showResponse && (
            <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-gray-50 p-4 text-xs leading-relaxed text-gray-700">
              {model.response}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function ModelResponsePanel({ results }: ModelResponsePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const models = Object.values(results.modelResults).sort(
    (a, b) => b.weightedScore - a.weightedScore
  );

  // Don't render if no models have response or reasoning data (legacy runs)
  const hasData = models.some((m) => m.response || m.reasoningSummary);
  if (!hasData) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Judge reasoning &amp; model outputs
        </h2>
        <span
          className="text-xs text-gray-400 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          &#9654;
        </span>
      </button>
      {expanded && (
        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
          {models.map((model, i) => (
            <ModelCard key={model.modelId} model={model} rank={i} />
          ))}
        </div>
      )}
    </div>
  );
}
