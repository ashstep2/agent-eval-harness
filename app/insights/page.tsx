'use client';

import { useState } from 'react';
import { RadarChart } from '@/components/agent-eval/radar-chart';

// ── Hardcoded data from 16 eval runs ──

const CODEX_WINS = 14;
const CLAUDE_WINS = 2;
const TOTAL_RUNS = 16;
const AVG_GAP = 0.82;

const CODEX_DIMS: Record<string, number> = {
  context_utilization: 4.88,
  correctness: 4.75,
  edge_case_handling: 4.25,
  completeness: 4.69,
  style_adherence: 4.75,
  explanation_quality: 4.81,
};

const CLAUDE_DIMS: Record<string, number> = {
  context_utilization: 3.56,
  correctness: 3.75,
  edge_case_handling: 3.31,
  completeness: 3.81,
  style_adherence: 4.00,
  explanation_quality: 4.50,
};

const CONTEXT_GAP = CODEX_DIMS.context_utilization - CLAUDE_DIMS.context_utilization;
const EXPLANATION_GAP = CODEX_DIMS.explanation_quality - CLAUDE_DIMS.explanation_quality;

const RADAR_DATA = {
  'gpt-5.3-codex': {
    modelId: 'gpt-5.3-codex',
    displayName: 'GPT-5.3 Codex',
    dimensionAverages: CODEX_DIMS,
  },
  'claude-opus-4-6': {
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    dimensionAverages: CLAUDE_DIMS,
  },
};

const AGENT_LOOP_DELTAS = [
  {
    task: 'Review Caching Layer PR',
    singleShot: 3.55,
    agentLoop: 4.75,
    delta: 1.20,
    singleShotRunId: '0c4948c4-dbee-45a2-bc94-5aaf04102d04',
    runId: '2d97e235-30dc-461c-9435-b5dba144c3aa',
  },
  {
    task: 'Refactor Callbacks to Async/Await',
    singleShot: 2.45,
    agentLoop: 3.50,
    delta: 1.05,
    singleShotRunId: '10608145-5e70-4077-a417-75fadc66030d',
    runId: '5fccd0ae-f8f0-4719-ac07-d7f637e8a491',
  },
  {
    task: 'Debug Memory Leak in WebSocket Handler',
    singleShot: 3.05,
    agentLoop: 3.80,
    delta: 0.75,
    singleShotRunId: '3c6501c0-9b6f-4562-afd6-eec860f44683',
    runId: '3a64f713-bf3f-4bfb-b0bb-90dbf8127069',
  },
];

const AGREEMENT = { shipFast: 100, devTrust: 76 };

const DIM_AGREEMENT: Record<string, number> = {
  explanation_quality: 94,
  style_adherence: 84,
  correctness: 81,
  completeness: 81,
  edge_case_handling: 81,
  context_utilization: 62,
};

const BIAS_STATS = {
  claudePrimaryMinusSecondary: 1.33,
  codexPrimaryMinusSecondary: -0.25,
};

const EVIDENCE = {
  finding1: [
    'a4f54b5b-dc75-46d6-aa47-919c427e0304',
    '090a3a64-ca37-4131-b878-bdff8d32fdad',
    'e3a84e03-5f24-435f-b5cf-57fcd8bcb463',
  ],
  finding2: [
    '0c4948c4-dbee-45a2-bc94-5aaf04102d04',
    '2d97e235-30dc-461c-9435-b5dba144c3aa',
    '10608145-5e70-4077-a417-75fadc66030d',
    '5fccd0ae-f8f0-4719-ac07-d7f637e8a491',
  ],
  finding3: ['10608145-5e70-4077-a417-75fadc66030d'],
  methodology: [
    'e7b91243-801b-45ea-96e5-8abf6a4883eb',
    '90c16c1e-803c-4227-a6d3-60a5a905ab46',
  ],
};

const RUN_TITLES: Record<string, string> = {
  'a4f54b5b-dc75-46d6-aa47-919c427e0304': 'Off-by-One Bugfix (single shot, developer trust)',
  '090a3a64-ca37-4131-b878-bdff8d32fdad': 'Optimize DB Query (single shot, developer trust)',
  'e3a84e03-5f24-435f-b5cf-57fcd8bcb463': 'Off-by-One Bugfix (single shot, ship fast)',
  '0c4948c4-dbee-45a2-bc94-5aaf04102d04': 'Caching PR Review (single shot, developer trust)',
  '2d97e235-30dc-461c-9435-b5dba144c3aa': 'Caching PR Review (agent loop, developer trust)',
  '10608145-5e70-4077-a417-75fadc66030d': 'Refactor Callbacks (single shot, developer trust)',
  '5fccd0ae-f8f0-4719-ac07-d7f637e8a491': 'Refactor Callbacks (agent loop, developer trust)',
  '3c6501c0-9b6f-4562-afd6-eec860f44683': 'Memory Leak (single shot, developer trust)',
  '3a64f713-bf3f-4bfb-b0bb-90dbf8127069': 'Memory Leak (agent loop, developer trust)',
  'e7b91243-801b-45ea-96e5-8abf6a4883eb': 'Dark Mode (single shot, developer trust)',
  '90c16c1e-803c-4227-a6d3-60a5a905ab46': 'Dark Mode (single shot, ship fast)',
};

// ── Components ──

function EvidenceLinks({ runIds }: { runIds: string[] }) {
  if (runIds.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Evidence:</span>
      {runIds.map((id) => (
        <a
          key={id}
          href={`/agent-eval/results?runId=${id}`}
          className="rounded border border-gray-200 px-2 py-0.5 text-gray-500 transition-colors hover:border-gray-400 hover:text-black"
        >
          {RUN_TITLES[id] || 'Run'} · {id.slice(0, 8)}
        </a>
      ))}
    </div>
  );
}

// ── Page ──

export default function InsightsPage() {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">

      {/* ── ABOVE THE FOLD: Summary ── */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Codex wins {CODEX_WINS} of {TOTAL_RUNS} head-to-head runs
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Average margin: +{AVG_GAP.toFixed(2)} points.
          GPT-5.3 Codex vs Claude Opus 4.6, scored by cross-provider dual judges (Claude Sonnet 4 + GPT-5.2) across 10 coding tasks and 6 dimensions.
        </p>
      </div>

      {/* Scoreboard */}
      <div className="mb-10 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        <div className="bg-white px-4 py-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{CODEX_WINS}</div>
          <div className="mt-0.5 text-xs text-gray-500">Codex wins</div>
        </div>
        <div className="bg-white px-4 py-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{CLAUDE_WINS}</div>
          <div className="mt-0.5 text-xs text-gray-500">Claude wins</div>
        </div>
        <div className="bg-white px-4 py-4 text-center">
          <div className="text-3xl font-bold text-gray-400">{TOTAL_RUNS}</div>
          <div className="mt-0.5 text-xs text-gray-500">Total runs</div>
        </div>
        <div className="bg-white px-4 py-4 text-center">
          <div className="text-3xl font-bold text-gray-400">+{AVG_GAP.toFixed(2)}</div>
          <div className="mt-0.5 text-xs text-gray-500">Avg margin</div>
        </div>
      </div>

      {/* 3 Product Bets (summary) */}
      <div className="mb-10 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-black">Three product bets from these findings</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">1</span>
            <p className="text-sm text-gray-700"><strong>Context is the moat.</strong> Codex leads context utilization by +{CONTEXT_GAP.toFixed(2)}. Make it visible in the UX.</p>
          </div>
          <div className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">2</span>
            <p className="text-sm text-gray-700"><strong>Task-adaptive agent loops.</strong> Mandatory for code review; optional for generation.</p>
          </div>
          <div className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">3</span>
            <p className="text-sm text-gray-700"><strong>Trust surface &gt; capability surface.</strong> Diff-first UI, confidence signals, progressive delegation.</p>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <a
            href="https://github.com/ashstep2/agent-eval-harness/blob/master/PRODUCT_STRATEGY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 transition-colors hover:text-black"
          >
            Full analysis in the product strategy doc →
          </a>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="mb-10 border-t border-gray-200" />

      {/* ── BELOW THE FOLD: Detailed Findings ── */}
      <div className="mb-6">
        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">Detailed findings</h2>
      </div>

      <div className="space-y-10">

        {/* Finding 1 */}
        <section>
          <div className="mb-1 text-xs font-medium text-gray-400">Finding 1</div>
          <h3 className="mb-3 text-lg font-semibold text-black">Codex wins on trust, not intelligence</h3>

          <div className="mb-4 rounded-md border border-gray-100 bg-white p-4">
            {/* @ts-expect-error radar expects AgentModelResult but we're passing a subset */}
            <RadarChart results={RADAR_DATA} size={260} />
          </div>

          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            Largest gap: <strong>context utilization</strong> (+{CONTEXT_GAP.toFixed(2)}).
            Narrowest gap: <strong>explanation quality</strong> (+{EXPLANATION_GAP.toFixed(2)}), Claude&apos;s relative strength.
            Codex leads every dimension, but the advantage concentrates on &quot;trust&quot; dimensions where conservative, accurate changes matter most.
          </p>

          <div className="rounded-md bg-gray-50 px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Product implication</div>
            <p className="mt-1 text-sm text-gray-700">
              The advantage is behavioral, not capability-based. Codex makes conservative, verifiable changes. The product moat is trust. Make context utilization visible in the UX.
            </p>
          </div>

          <EvidenceLinks runIds={EVIDENCE.finding1} />
        </section>

        {/* Finding 2 */}
        <section>
          <div className="mb-1 text-xs font-medium text-gray-400">Finding 2</div>
          <h3 className="mb-3 text-lg font-semibold text-black">Agent loops fix hallucination but not judgment</h3>

          <div className="mb-3 overflow-hidden rounded-md border border-gray-200">
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
                {AGENT_LOOP_DELTAS.map((d) => (
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

          <p className="mb-2 text-sm leading-relaxed text-gray-600">
            Caching PR review: loop caught a hallucinated bug (+{AGENT_LOOP_DELTAS[0].delta.toFixed(2)}).
            Refactor task: same API-breaking flaw persisted across all 5 steps (+{AGENT_LOOP_DELTAS[1].delta.toFixed(2)}).
          </p>

          <div className="rounded-md bg-gray-50 px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Product implication</div>
            <p className="mt-1 text-sm text-gray-700">
              Make loops task-adaptive: mandatory for code review (eliminates hallucination), optional for generation (judgment errors persist regardless of step count).
            </p>
          </div>

          <EvidenceLinks runIds={EVIDENCE.finding2} />
        </section>

        {/* Finding 3 */}
        <section>
          <div className="mb-1 text-xs font-medium text-gray-400">Finding 3</div>
          <h3 className="mb-3 text-lg font-semibold text-black">Explanation quality is necessary but not sufficient</h3>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                Opus: Pair Programmer
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Explanation: <strong className="text-black">{CLAUDE_DIMS.explanation_quality.toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong className="text-black">{CLAUDE_DIMS.correctness.toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Explains well; code may need human correction.</div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-blue-500">
                Codex: Delegated Agent
              </div>
              <div className="space-y-1 text-sm text-blue-800">
                <div>Explanation: <strong>{CODEX_DIMS.explanation_quality.toFixed(2)}</strong>/5</div>
                <div>Correctness: <strong>{CODEX_DIMS.correctness.toFixed(2)}</strong>/5</div>
              </div>
              <div className="mt-2 text-xs text-blue-600">Code works. Explanation is adequate.</div>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Product implication</div>
            <p className="mt-1 text-sm text-gray-700">
              Two product paths: Opus as pair programmer (explains what to do, human verifies), Codex as delegated agent (does it correctly). For autonomous delegation, correctness &gt; explanation.
            </p>
          </div>

          <EvidenceLinks runIds={EVIDENCE.finding3} />
        </section>
      </div>

      {/* ── Methodology (collapsed) ── */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <button
          onClick={() => setShowMethodology((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-600"
        >
          <span className={`inline-block text-xs transition-transform ${showMethodology ? 'rotate-90' : ''}`}>&#9654;</span>
          Methodology notes
        </button>

        {showMethodology && (
          <div className="mt-6 space-y-8">
            <section>
              <h3 className="mb-3 text-base font-semibold text-black">Judges agree more when the question is objective</h3>
              <p className="mb-3 text-sm text-gray-600">
                Ship_fast runs: <strong>{AGREEMENT.shipFast}%</strong> agreement.
                Developer_trust runs: <strong>{AGREEMENT.devTrust}%</strong>.
              </p>
              <div className="space-y-2">
                {Object.entries(DIM_AGREEMENT)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, rate]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const color = rate >= 85 ? 'text-emerald-600' : rate >= 75 ? 'text-gray-600' : 'text-amber-600';
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-gray-800" style={{ width: `${rate}%` }} />
                          </div>
                          <span className={`w-12 text-right font-mono text-xs ${color}`}>{rate}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-base font-semibold text-black">Same-family scoring bias is measurable</h3>
              <div className="mb-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Opus scored by Sonnet vs GPT-5.2</span>
                  <span className="font-mono text-xs text-amber-600">+{BIAS_STATS.claudePrimaryMinusSecondary.toFixed(2)} bias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Codex scored by Sonnet vs GPT-5.2</span>
                  <span className="font-mono text-xs text-gray-500">{BIAS_STATS.codexPrimaryMinusSecondary.toFixed(2)} bias</span>
                </div>
              </div>
              <p className="mb-3 text-sm text-gray-600">
                The cross-family judge flagged hallucinated bugs, broken API contracts, and incomplete implementations that the same-family judge rated 4-5/5.
              </p>
              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                Matches published findings on LLM self-preference bias. See{' '}
                <a href="https://arxiv.org/abs/2410.21819" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ICLR 2025</a>{' '}and{' '}
                <a href="https://arxiv.org/abs/2508.06709" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spiliopoulou et al. 2025</a>.
              </div>
              <EvidenceLinks runIds={EVIDENCE.methodology} />
            </section>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <a href="/agent-eval" className="text-sm text-blue-600 transition-colors hover:text-black">
          Run the evals yourself →
        </a>
      </div>
    </div>
  );
}
