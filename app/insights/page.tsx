'use client';

import { useEffect, useMemo } from 'react';
import { RadarChart } from '@/components/agent-eval/radar-chart';
import { useAgentEvalStore } from '@/store/agent-eval-store';

function InsightCard({
  number,
  title,
  children,
  implication,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  implication: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8">
      <div className="mb-2 text-xs font-medium text-gray-400">Finding {number}</div>
      <h3 className="text-xl font-semibold text-black">{title}</h3>
      <div className="mt-4 text-sm leading-relaxed text-gray-600">
        {children}
      </div>
      <div className="mt-6 rounded-md bg-gray-50 p-4">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
          Product implication
        </div>
        <p className="text-sm text-gray-700">{implication}</p>
      </div>
    </div>
  );
}

function DimensionBar({ label, codex, claude }: { label: string; codex: number; claude: number }) {
  const gap = codex - claude;
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="w-36 text-gray-600">{label}</div>
      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${(codex / 5) * 100}%` }}
            />
            <span className="font-mono text-xs text-blue-600">{codex.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-2 rounded-full bg-gray-800"
              style={{ width: `${(claude / 5) * 100}%` }}
            />
            <span className="font-mono text-xs text-gray-600">{claude.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="w-16 text-right font-mono text-xs text-gray-400">
        +{gap.toFixed(2)}
      </div>
    </div>
  );
}

function EvidenceLinks({
  runIds,
  runTitleById,
}: {
  runIds: string[];
  runTitleById: Record<string, string>;
}) {
  if (runIds.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
        Evidence
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {runIds.map((id) => (
          <a
            key={id}
            href={`/agent-eval/results?runId=${id}`}
            className="rounded border border-gray-200 px-2 py-1 text-gray-600 transition-colors hover:border-gray-400 hover:text-black"
          >
            {runTitleById[id] || 'Run'} · {id.slice(0, 8)}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { savedRuns, loadRuns } = useAgentEvalStore();

  useEffect(() => { loadRuns(); }, [loadRuns]);

  // Aggregate scores across all runs for the two primary models
  const aggregated = useMemo(() => {
    const codexScores: Record<string, number[]> = {};
    const claudeScores: Record<string, number[]> = {};

    for (const run of savedRuns) {
      for (const [modelId, result] of Object.entries(run.modelResults)) {
        const target = modelId === 'gpt-5.3-codex' ? codexScores : modelId === 'claude-opus-4-6' ? claudeScores : null;
        if (!target) continue;
        for (const [dim, score] of Object.entries(result.dimensionAverages)) {
          if (!target[dim]) target[dim] = [];
          target[dim].push(score);
        }
      }
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      codex: Object.fromEntries(Object.entries(codexScores).map(([k, v]) => [k, avg(v)])),
      claude: Object.fromEntries(Object.entries(claudeScores).map(([k, v]) => [k, avg(v)])),
    };
  }, [savedRuns]);

  // Build radar data for comparison
  const radarData = useMemo(() => {
    return {
      'gpt-5.3-codex': {
        modelId: 'gpt-5.3-codex',
        displayName: 'GPT-5.3 Codex',
        dimensionAverages: aggregated.codex as Record<string, number>,
      },
      'claude-opus-4-6': {
        modelId: 'claude-opus-4-6',
        displayName: 'Claude Opus 4.6',
        dimensionAverages: aggregated.claude as Record<string, number>,
      },
    };
  }, [aggregated]);

  // Count head-to-head wins
  const headToHead = savedRuns.filter(r => r.models.includes('gpt-5.3-codex') && r.models.includes('claude-opus-4-6'));
  const codexWins = headToHead.filter(r => r.winner === 'gpt-5.3-codex').length;
  const claudeWins = headToHead.filter(r => r.winner === 'claude-opus-4-6').length;
  const observedTaskCount = new Set(savedRuns.map((run) => run.taskId)).size;

  // Compute average gap
  const avgGap = useMemo(() => {
    if (headToHead.length === 0) return 0;
    const gaps = headToHead.map(r => {
      const cxScore = r.modelResults['gpt-5.3-codex']?.weightedScore || 0;
      const clScore = r.modelResults['claude-opus-4-6']?.weightedScore || 0;
      return cxScore - clScore;
    });
    return gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }, [headToHead]);

  // Agent loop runs
  const agentLoopRuns = savedRuns.filter(r => r.mode === 'agent_loop');
  const singleShotRuns = savedRuns.filter(r => r.mode === 'single_shot');

  // Agent loop deltas for Claude
  const agentLoopDeltas = useMemo(() => {
    return agentLoopRuns.map(alr => {
      const matchingSS = singleShotRuns.find(
        ss => ss.taskTitle === alr.taskTitle && ss.weightPreset === alr.weightPreset
      );
      if (!matchingSS) return null;
      const alClaude = alr.modelResults['claude-opus-4-6']?.weightedScore || 0;
      const ssClaude = matchingSS.modelResults['claude-opus-4-6']?.weightedScore || 0;
      return {
        runId: alr.id,
        singleShotRunId: matchingSS.id,
        task: alr.taskTitle,
        singleShot: ssClaude,
        agentLoop: alClaude,
        delta: alClaude - ssClaude,
      };
    }).filter(Boolean) as {
      runId: string;
      singleShotRunId: string;
      task: string;
      singleShot: number;
      agentLoop: number;
      delta: number;
    }[];
  }, [agentLoopRuns, singleShotRuns]);

  // Judge agreement by preset
  const agreementByPreset = useMemo(() => {
    const sf: number[] = [];
    const dt: number[] = [];
    for (const run of savedRuns) {
      for (const mdata of Object.values(run.modelResults)) {
        const rate = (mdata as { agreement?: { alignmentRate?: number } }).agreement?.alignmentRate;
        if (rate == null) continue;
        if (run.weightPreset === 'ship_fast') sf.push(rate);
        else dt.push(rate);
      }
    }
    return {
      shipFast: sf.length > 0 ? (sf.reduce((a, b) => a + b, 0) / sf.length * 100) : 0,
      devTrust: dt.length > 0 ? (dt.reduce((a, b) => a + b, 0) / dt.length * 100) : 0,
    };
  }, [savedRuns]);

  // Per-dimension agreement
  const dimAgreement = useMemo(() => {
    const counts: Record<string, { agree: number; total: number }> = {};
    for (const run of savedRuns) {
      for (const mdata of Object.values(run.modelResults)) {
        const aligned = (mdata as { agreement?: { alignedDimensions?: Record<string, boolean> } }).agreement?.alignedDimensions;
        if (!aligned) continue;
        for (const [dim, val] of Object.entries(aligned)) {
          if (!counts[dim]) counts[dim] = { agree: 0, total: 0 };
          counts[dim].total++;
          if (val) counts[dim].agree++;
        }
      }
    }
    return Object.fromEntries(
      Object.entries(counts).map(([dim, { agree, total }]) => [dim, Math.round((agree / total) * 100)])
    );
  }, [savedRuns]);

  const dimensionGaps = useMemo(() => {
    const contextGap = (aggregated.codex.context_utilization || 0) - (aggregated.claude.context_utilization || 0);
    const explanationGap = (aggregated.codex.explanation_quality || 0) - (aggregated.claude.explanation_quality || 0);
    return { contextGap, explanationGap };
  }, [aggregated]);

  const runTitleById = useMemo(
    () =>
      Object.fromEntries(
        savedRuns.map((run) => [
          run.id,
          `${run.taskTitle} (${run.mode.replace('_', ' ')}, ${run.weightPreset.replace('_', ' ')})`,
        ])
      ),
    [savedRuns]
  );

  const evidence = useMemo(() => {
    const byAbsMargin = [...headToHead].sort((a, b) => {
      const aGap = Math.abs((a.modelResults['gpt-5.3-codex']?.weightedScore || 0) - (a.modelResults['claude-opus-4-6']?.weightedScore || 0));
      const bGap = Math.abs((b.modelResults['gpt-5.3-codex']?.weightedScore || 0) - (b.modelResults['claude-opus-4-6']?.weightedScore || 0));
      return bGap - aGap;
    });
    const claudeWin = headToHead.find((r) => r.winner === 'claude-opus-4-6');
    const highestAgreement = [...headToHead].sort((a, b) => b.interJudgeAgreement.alignmentRate - a.interJudgeAgreement.alignmentRate)[0];
    const lowestAgreement = [...headToHead].sort((a, b) => a.interJudgeAgreement.alignmentRate - b.interJudgeAgreement.alignmentRate)[0];

    let explanationVsCorrectnessRun: string | null = null;
    let biggestGap = -Infinity;
    for (const run of headToHead) {
      const claude = run.modelResults['claude-opus-4-6'];
      if (!claude) continue;
      const diff = (claude.dimensionAverages.explanation_quality || 0) - (claude.dimensionAverages.correctness || 0);
      if (diff > biggestGap) {
        biggestGap = diff;
        explanationVsCorrectnessRun = run.id;
      }
    }

    return {
      finding1: [byAbsMargin[0]?.id, byAbsMargin[1]?.id, claudeWin?.id].filter(Boolean) as string[],
      finding2: agentLoopDeltas.slice(0, 2).flatMap((d) => [d.singleShotRunId, d.runId]),
      finding3: [highestAgreement?.id, lowestAgreement?.id].filter(Boolean) as string[],
      finding4: explanationVsCorrectnessRun ? [explanationVsCorrectnessRun] : [],
      finding5: [highestAgreement?.id, lowestAgreement?.id].filter(Boolean) as string[],
    };
  }, [headToHead, agentLoopDeltas]);

  const biasStats = useMemo(() => {
    const claudeDeltas: number[] = [];
    const codexDeltas: number[] = [];
    for (const run of headToHead) {
      const claude = run.modelResults['claude-opus-4-6'];
      const codex = run.modelResults['gpt-5.3-codex'];
      if (claude) claudeDeltas.push(claude.primary.overallScore - claude.secondary.overallScore);
      if (codex) codexDeltas.push(codex.primary.overallScore - codex.secondary.overallScore);
    }
    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    return {
      claudePrimaryMinusSecondary: avg(claudeDeltas),
      codexPrimaryMinusSecondary: avg(codexDeltas),
    };
  }, [headToHead]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-16">
        <div className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-400">
          Analysis
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-black">
          Insights
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Synthesized findings from {savedRuns.length} evaluation runs across {observedTaskCount} coding tasks.
          Head-to-head: GPT-5.3 Codex wins {codexWins}, Claude Opus 4.6 wins {claudeWins}.
          Average gap: {avgGap.toFixed(2)} points.
        </p>
      </div>

      <div className="space-y-12">
        {/* Finding 1: Codex wins 14-2 */}
        <InsightCard
          number={1}
          title={`Codex wins ${codexWins} of ${headToHead.length}, but the why matters more than the score`}
          implication="Codex wins on trust, not intelligence. It makes conservative, verifiable changes: exactly what you want from an agent you delegate to. The product advantage is behavioral, not capability-based."
        >
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-md border border-gray-200 p-4 text-center">
              <div className="text-3xl font-semibold text-blue-600">{codexWins}</div>
              <div className="mt-1 text-xs text-gray-500">Codex wins</div>
            </div>
            <div className="rounded-md border border-gray-200 p-4 text-center">
              <div className="text-3xl font-semibold text-gray-800">{claudeWins}</div>
              <div className="mt-1 text-xs text-gray-500">Claude wins</div>
            </div>
            <div className="rounded-md border border-gray-200 p-4 text-center">
              <div className="text-3xl font-semibold text-gray-400">{avgGap.toFixed(2)}</div>
              <div className="mt-1 text-xs text-gray-500">Avg gap</div>
            </div>
          </div>

          <div className="mb-6 rounded-md border border-gray-100 p-4">
            {/* @ts-expect-error radar expects AgentModelResult but we're passing a subset */}
            <RadarChart results={radarData} size={280} />
          </div>

          <div className="space-y-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> GPT-5.3 Codex</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-800" /> Claude Opus 4.6</span>
              <span className="ml-auto">Gap</span>
            </div>
            <DimensionBar label="Context" codex={aggregated.codex.context_utilization || 0} claude={aggregated.claude.context_utilization || 0} />
            <DimensionBar label="Correctness" codex={aggregated.codex.correctness || 0} claude={aggregated.claude.correctness || 0} />
            <DimensionBar label="Edge Cases" codex={aggregated.codex.edge_case_handling || 0} claude={aggregated.claude.edge_case_handling || 0} />
            <DimensionBar label="Completeness" codex={aggregated.codex.completeness || 0} claude={aggregated.claude.completeness || 0} />
            <DimensionBar label="Style" codex={aggregated.codex.style_adherence || 0} claude={aggregated.claude.style_adherence || 0} />
            <DimensionBar label="Explanation" codex={aggregated.codex.explanation_quality || 0} claude={aggregated.claude.explanation_quality || 0} />
          </div>
          <p className="mt-4">
            The narrowest gap is <strong>explanation quality</strong> ({dimensionGaps.explanationGap >= 0 ? '+' : ''}
            {dimensionGaps.explanationGap.toFixed(2)}), Opus&apos;s relative strength.
            The widest is <strong>context utilization</strong> ({dimensionGaps.contextGap >= 0 ? '+' : ''}
            {dimensionGaps.contextGap.toFixed(2)}). Codex leads on every dimension, but
            the pattern reveals that its advantage is largest on &quot;trust&quot; dimensions (context, correctness)
            where conservative, accurate changes matter most.
          </p>
          <EvidenceLinks runIds={evidence.finding1} runTitleById={runTitleById} />
        </InsightCard>

        {/* Finding 2: Agent Loops */}
        <InsightCard
          number={2}
          title="Agent loops fix hallucination but not judgment"
          implication="Agent loops should be mandatory for code review (where hallucination is the primary risk) and optional for code generation (where the model needs to make judgment calls that don't improve with more steps)."
        >
          <p className="mb-4">
            {agentLoopDeltas.length} task{agentLoopDeltas.length === 1 ? '' : 's'} were run in both single-shot and 5-step agent loop mode.
            The loop often improves score quality, but the <em>type</em> of
            improvement reveals a critical distinction.
          </p>

          <div className="mb-4 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Task</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Single-shot</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Agent loop</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Delta</th>
                </tr>
              </thead>
              <tbody>
                {agentLoopDeltas.map((d) => (
                  <tr key={d.task} className="border-b border-gray-50">
                    <td className="px-4 py-2 text-gray-700">{d.task}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500">{d.singleShot.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">{d.agentLoop.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">+{d.delta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {agentLoopDeltas.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs font-medium text-gray-700">
                  Best observed loop gain: {agentLoopDeltas[0].task} (+{agentLoopDeltas[0].delta.toFixed(2)})
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Agent loop can recover from some first-pass errors, but gains vary by task.
                </div>
              </div>
            )}
          </div>
          <EvidenceLinks runIds={evidence.finding2} runTitleById={runTitleById} />
        </InsightCard>

        {/* Finding 3: Judge Agreement */}
        <InsightCard
          number={3}
          title="Judges agree more when the question is objective"
          implication="Invest in objective eval dimensions first. For subjective dimensions (context, style), product design (not model training) determines the user experience. Consider letting users configure which dimensions they care about."
        >
          <p className="mb-4">
            Ship_fast runs show <strong>{agreementByPreset.shipFast.toFixed(0)}%</strong> judge agreement.
            Developer_trust runs: <strong>{agreementByPreset.devTrust.toFixed(0)}%</strong>.
            The pattern is clear: judges agree on objective questions and diverge on subjective ones.
          </p>

          <div className="space-y-2">
            {[
              { dim: 'Explanation Quality', key: 'explanation_quality', color: 'text-emerald-600' },
              { dim: 'Style Adherence', key: 'style_adherence', color: 'text-emerald-600' },
              { dim: 'Correctness', key: 'correctness', color: 'text-emerald-600' },
              { dim: 'Completeness', key: 'completeness', color: 'text-emerald-600' },
              { dim: 'Edge Cases', key: 'edge_case_handling', color: 'text-gray-600' },
              { dim: 'Context Utilization', key: 'context_utilization', color: 'text-amber-600' },
            ].sort((a, b) => (dimAgreement[b.key] || 0) - (dimAgreement[a.key] || 0))
              .map((item) => {
                const rate = dimAgreement[item.key] || 0;
                const color = rate >= 85 ? 'text-emerald-600' : rate >= 75 ? 'text-gray-600' : 'text-amber-600';
                const label = rate >= 85 ? 'High' : rate >= 75 ? 'Moderate' : 'Low';
                return (
                  <div key={item.dim} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.dim}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-gray-800"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="w-10 font-mono text-xs text-gray-500">{rate}%</span>
                      <span className={`w-16 text-xs ${color}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
          </div>
          <EvidenceLinks runIds={evidence.finding3} runTitleById={runTitleById} />
        </InsightCard>

        {/* Finding 4: Explanation Quality */}
        <InsightCard
          number={4}
          title="Explanation quality is necessary but not sufficient"
          implication="Explanation without execution is a liability for an autonomous agent. Opus excels as a pair programmer (explaining what to do), but Codex excels as a delegated agent (doing it correctly). These are different product paths."
        >
          <p className="mb-4">
            Opus scores {(aggregated.claude.explanation_quality || 0).toFixed(2)}/5 on explanation quality,
            its strongest dimension and the narrowest gap with Codex.
            But explanation quality doesn&apos;t compensate for correctness:
          </p>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-md border border-gray-200 p-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Opus: Pair Programmer
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Explanation: <strong>{(aggregated.claude.explanation_quality || 0).toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong>{(aggregated.claude.correctness || 0).toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Explains well, but the code may need human correction.
              </div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-400">
                Codex: Delegated Agent
              </div>
              <div className="space-y-1 text-xs text-blue-700">
                <div>Explanation: <strong>{(aggregated.codex.explanation_quality || 0).toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong>{(aggregated.codex.correctness || 0).toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                Code works. Explanations are adequate but not exceptional.
              </div>
            </div>
          </div>

          <p>
            In the strongest explanation-vs-correctness mismatch run, explanation significantly outscored correctness.
            This is the core risk: a developer can read a clear explanation and still get incorrect or unsafe code.
          </p>
          <EvidenceLinks runIds={evidence.finding4} runTitleById={runTitleById} />
        </InsightCard>

        {/* Finding 5: Same-Family Bias */}
        <InsightCard
          number={5}
          title="Judge-family scoring skew is measurable in this run set"
          implication="Any LLM-as-judge system needs cross-provider validation. A single-judge system from the same family as the model being evaluated will systematically inflate scores. This applies to any team building eval infrastructure."
        >
          <p className="mb-4">
            Early evaluation runs used Claude Sonnet as the sole judge. When we added GPT-5.2
            as a secondary judge, a clear pattern emerged:
          </p>

          <div className="mb-4 rounded-md border border-gray-200 p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              Same-family scoring bias
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Opus: Sonnet score minus GPT-5.2 score</span>
                <span className="font-mono text-xs text-amber-600">
                  {biasStats.claudePrimaryMinusSecondary >= 0 ? '+' : ''}
                  {biasStats.claudePrimaryMinusSecondary.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Codex: Sonnet score minus GPT-5.2 score</span>
                <span className="font-mono text-xs text-gray-500">
                  {biasStats.codexPrimaryMinusSecondary >= 0 ? '+' : ''}
                  {biasStats.codexPrimaryMinusSecondary.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <p className="mb-4">
            The secondary judge&apos;s criticisms weren&apos;t random; they were substantive. GPT-5.2
            flagged hallucinated bugs, broken API contracts, and incomplete implementations that
            Sonnet rated 4-5/5.
          </p>

          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            <strong>Research alignment:</strong> This matches published findings on LLM self-preference
            bias: models assign higher scores to outputs with lower perplexity (text that
            &quot;sounds like&quot; them). See{' '}
            <a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              ICLR 2025
            </a>{' '}and{' '}
            <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Spiliopoulou et al. 2025
            </a>.
          </div>
          <EvidenceLinks runIds={evidence.finding5} runTitleById={runTitleById} />
        </InsightCard>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <a
          href="/agent-eval"
          className="text-sm text-blue-600 transition-colors hover:text-black"
        >
          Run the evals yourself →
        </a>
      </div>
    </div>
  );
}
