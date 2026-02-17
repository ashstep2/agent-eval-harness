import {
  AgentDimensionName,
  AgentJudgeScore,
  InterJudgeAgreement,
} from '@/types';

export function computeWeightedScore(
  scores: AgentJudgeScore,
  weights: Record<AgentDimensionName, number>
): number {
  let total = 0;
  for (const dimScore of scores.dimensionScores) {
    const weight = weights[dimScore.dimension] ?? 0;
    total += dimScore.score * weight;
  }
  return Math.round(total * 100) / 100;
}

export function averageDimensionScores(
  scores: AgentJudgeScore
): Record<AgentDimensionName, number> {
  const map = {} as Record<AgentDimensionName, number>;
  for (const dimScore of scores.dimensionScores) {
    map[dimScore.dimension] = dimScore.score;
  }
  return map;
}

export function computeAgreement(
  primary: AgentJudgeScore,
  secondary: AgentJudgeScore
): InterJudgeAgreement {
  const alignedDimensions = {} as Record<AgentDimensionName, boolean>;
  let alignedCount = 0;

  for (const primaryScore of primary.dimensionScores) {
    const secondaryScore = secondary.dimensionScores.find(
      (s) => s.dimension === primaryScore.dimension
    );
    const aligned =
      secondaryScore ? Math.abs(primaryScore.score - secondaryScore.score) <= 1 : false;
    alignedDimensions[primaryScore.dimension] = aligned;
    if (aligned) alignedCount += 1;
  }

  const alignmentRate =
    primary.dimensionScores.length > 0
      ? alignedCount / primary.dimensionScores.length
      : 0;

  return {
    alignedDimensions,
    alignmentRate,
  };
}

/**
 * Build a concise reasoning summary from the ranking judge's per-dimension
 * reasoning. Highlights strengths (score >= 4) and weaknesses (score <= 2),
 * giving a human-readable snapshot of why the model scored the way it did.
 */
export function buildReasoningSummary(scores: AgentJudgeScore): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const dim of scores.dimensionScores) {
    if (dim.score >= 4) {
      strengths.push(`${dim.dimension} (${dim.score}/5): ${dim.reasoning}`);
    } else if (dim.score <= 2) {
      weaknesses.push(`${dim.dimension} (${dim.score}/5): ${dim.reasoning}`);
    }
  }

  const parts: string[] = [];
  if (strengths.length > 0) {
    parts.push(`Strengths: ${strengths.join(' | ')}`);
  }
  if (weaknesses.length > 0) {
    parts.push(`Weaknesses: ${weaknesses.join(' | ')}`);
  }
  if (parts.length === 0) {
    // All scores in the 3 range — middle-of-the-road
    const dims = scores.dimensionScores.map(
      (d) => `${d.dimension} (${d.score}/5)`
    );
    parts.push(`Mixed results across dimensions: ${dims.join(', ')}`);
  }

  return parts.join(' — ');
}
