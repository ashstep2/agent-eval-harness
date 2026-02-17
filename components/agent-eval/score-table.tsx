'use client';

import { AgentEvaluationResults, AgentDimensionName } from '@/types';
import { getAgentDimensionDisplayName, getAgentDimensionDescription } from '@/lib/agent-eval/dimensions';
import { getModelDisplayName, getModelConfig } from '@/lib/data/models';

interface ScoreTableProps {
  results: AgentEvaluationResults;
}

const DIMENSIONS: AgentDimensionName[] = [
  'correctness',
  'style_adherence',
  'context_utilization',
  'completeness',
  'explanation_quality',
  'edge_case_handling',
];

/** Returns which judge role is used for ranking (the cross-family one). */
function getRankingJudgeRole(modelId: string): 'primary' | 'secondary' {
  const config = getModelConfig(modelId);
  // Primary = Sonnet (Anthropic), Secondary = GPT-5.2 (OpenAI)
  // Cross-family: Anthropic models → secondary, OpenAI models → primary
  return config?.provider === 'anthropic' ? 'secondary' : 'primary';
}

function getRankingJudgeName(modelId: string): string {
  const role = getRankingJudgeRole(modelId);
  return role === 'primary' ? 'Sonnet 4' : 'GPT-5.2';
}

function getOtherJudgeName(modelId: string): string {
  const role = getRankingJudgeRole(modelId);
  return role === 'primary' ? 'GPT-5.2' : 'Sonnet 4';
}

function ScoreBar({ score, maxScore = 5, isWinner }: { score: number; maxScore?: number; isWinner: boolean }) {
  const pct = (score / maxScore) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${isWinner ? 'bg-black' : 'bg-gray-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-sm ${isWinner ? 'font-semibold text-black' : 'text-gray-500'}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function getRankingScore(
  results: AgentEvaluationResults,
  modelId: string,
  dimension: AgentDimensionName
): { ranking: number; other: number } {
  const model = results.modelResults[modelId];
  const role = getRankingJudgeRole(modelId);
  const rankingJudge = role === 'primary' ? model.primary : model.secondary;
  const otherJudge = role === 'primary' ? model.secondary : model.primary;
  const ranking = rankingJudge.dimensionScores.find((s) => s.dimension === dimension)?.score ?? 0;
  const other = otherJudge.dimensionScores.find((s) => s.dimension === dimension)?.score ?? 0;
  return { ranking, other };
}

export function ScoreTable({ results }: ScoreTableProps) {
  const modelIds = Object.keys(results.modelResults);

  // Find the highest cross-family score per dimension to highlight the winner
  const winnerByDimension: Record<string, { modelId: string; score: number }> = {};
  for (const dim of DIMENSIONS) {
    let best = { modelId: '', score: -1 };
    for (const modelId of modelIds) {
      const { ranking } = getRankingScore(results, modelId, dim);
      if (ranking > best.score) {
        best = { modelId, score: ranking };
      }
    }
    winnerByDimension[dim] = best;
  }

  return (
    <div className="space-y-6">
      {/* Methodology note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          How scoring works
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          Each response is scored by two independent LLM judges (Claude Sonnet 4 and GPT-5.2) on a 1&ndash;5 scale.
          To avoid <strong>same-family bias</strong> &mdash; where a judge favors outputs from its own provider &mdash;
          the ranking score comes from the <strong>cross-family judge</strong>: OpenAI models are scored by Sonnet,
          Anthropic models are scored by GPT-5.2. Both judges&apos; scores are shown for transparency.
        </p>
      </div>

      {/* The table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Dimension
              </th>
              {modelIds.map((modelId) => (
                <th
                  key={modelId}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  <div>{getModelDisplayName(modelId)}</div>
                  <div className="mt-0.5 font-normal normal-case tracking-normal text-gray-400">
                    scored by {getRankingJudgeName(modelId)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DIMENSIONS.map((dimension) => {
              const winner = winnerByDimension[dimension];
              // Check if it's a tie
              const tiedModels = modelIds.filter((id) => {
                const { ranking } = getRankingScore(results, id, dimension);
                return ranking === winner.score;
              });
              const isTie = tiedModels.length > 1;

              return (
                <tr key={dimension} className="group">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-black">
                      {getAgentDimensionDisplayName(dimension)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {getAgentDimensionDescription(dimension)}
                    </div>
                  </td>
                  {modelIds.map((modelId) => {
                    const { ranking, other } = getRankingScore(results, modelId, dimension);
                    const gap = Math.abs(ranking - other);
                    const isWinner = !isTie && winner.modelId === modelId;

                    return (
                      <td key={modelId} className={`px-5 py-4 ${isWinner ? 'bg-gray-50' : ''}`}>
                        <ScoreBar score={ranking} isWinner={isWinner} />
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                          <span>{getOtherJudgeName(modelId)}: {other.toFixed(1)}</span>
                          {gap > 1 && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">
                              {gap.toFixed(0)}pt gap
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary callout */}
      <DimensionSummary results={results} winnerByDimension={winnerByDimension} modelIds={modelIds} />
    </div>
  );
}

function DimensionSummary({
  results,
  winnerByDimension,
  modelIds,
}: {
  results: AgentEvaluationResults;
  winnerByDimension: Record<string, { modelId: string; score: number }>;
  modelIds: string[];
}) {
  // Count dimension wins per model (excluding ties)
  const wins: Record<string, string[]> = {};
  for (const modelId of modelIds) wins[modelId] = [];

  for (const dim of DIMENSIONS) {
    const winner = winnerByDimension[dim];
    const tiedModels = modelIds.filter((id) => {
      const { ranking } = getRankingScore(results, id, dim);
      return ranking === winner.score;
    });
    if (tiedModels.length === 1) {
      wins[winner.modelId].push(getAgentDimensionDisplayName(dim));
    }
  }

  // Find biggest gap across all dimensions
  let biggestGap = { dimension: '' as AgentDimensionName, leader: '', trailer: '', gap: 0 };
  for (const dim of DIMENSIONS) {
    const scores = modelIds.map((id) => ({
      modelId: id,
      score: getRankingScore(results, id, dim).ranking,
    }));
    scores.sort((a, b) => b.score - a.score);
    if (scores.length >= 2) {
      const gap = scores[0].score - scores[scores.length - 1].score;
      if (gap > biggestGap.gap) {
        biggestGap = {
          dimension: dim,
          leader: scores[0].modelId,
          trailer: scores[scores.length - 1].modelId,
          gap,
        };
      }
    }
  }

  const hasWins = Object.values(wins).some((w) => w.length > 0);

  if (!hasWins && biggestGap.gap === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        Key takeaways
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        {Object.entries(wins)
          .filter(([, dims]) => dims.length > 0)
          .map(([modelId, dims]) => (
            <div key={modelId}>
              <strong className="text-black">{getModelDisplayName(modelId)}</strong> leads on{' '}
              {dims.join(', ')} ({dims.length} of {DIMENSIONS.length} dimensions).
            </div>
          ))}
        {biggestGap.gap > 0 && (
          <div>
            Biggest gap: <strong className="text-black">{getAgentDimensionDisplayName(biggestGap.dimension)}</strong> &mdash;{' '}
            {getModelDisplayName(biggestGap.leader)} scores {biggestGap.gap.toFixed(1)} points higher
            than {getModelDisplayName(biggestGap.trailer)}.
          </div>
        )}
      </div>
    </div>
  );
}
