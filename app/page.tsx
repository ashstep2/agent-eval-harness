'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAgentEvalStore } from '@/store/agent-eval-store';
import { AGENT_TASKS } from '@/lib/agent-eval/tasks';

export default function Home() {
  const router = useRouter();
  const { savedRuns, loadRuns } = useAgentEvalStore();

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const headToHead = useMemo(
    () => savedRuns.filter((r) => r.models.includes('gpt-5.3-codex') && r.models.includes('claude-opus-4-6')),
    [savedRuns]
  );

  const codexWins = headToHead.filter((r) => r.winner === 'gpt-5.3-codex').length;
  const avgGap = useMemo(() => {
    if (headToHead.length === 0) return 0;
    const total = headToHead.reduce((sum, run) => {
      const codex = run.modelResults['gpt-5.3-codex']?.weightedScore || 0;
      const claude = run.modelResults['claude-opus-4-6']?.weightedScore || 0;
      return sum + (codex - claude);
    }, 0);
    return total / headToHead.length;
  }, [headToHead]);

  const singleShotRuns = savedRuns.filter((r) => r.mode === 'single_shot').length;
  const agentLoopRuns = savedRuns.filter((r) => r.mode === 'agent_loop').length;
  const shipFastRuns = savedRuns.filter((r) => r.weightPreset === 'ship_fast').length;

  const findings = [
    {
      title: `Codex wins ${codexWins} of ${headToHead.length || 0}, but the why matters more than the score.`,
      description:
        'Across current runs, Codex leads most head-to-heads. The key product question is not just who wins, but where and why outcomes change.',
      href: '/insights',
    },
    {
      title: 'Agent loops help in some tasks, not all.',
      description:
        'Agent-loop vs single-shot behavior differs by task type. The harness surfaces where extra reasoning steps improve outcomes and where they do not.',
      href: '/insights',
    },
    {
      title: `Average Codex margin: ${avgGap >= 0 ? '+' : ''}${avgGap.toFixed(2)} points.`,
      description:
        'This summary is generated from persisted runs. Insights page breaks down disagreement, confidence, and task-level evidence.',
      href: '/insights',
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-container flex-col justify-between px-6 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-black sm:text-5xl">
        Coding Agent Eval Harness: Which coding agent should we trust to ship code?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-500">
          Built an evaluation harness. {savedRuns.length} eval runs, {AGENT_TASKS.length} coding tasks,
          6 dimensions, 2 cross-provider judges: compare GPT-5.3 Codex vs Claude Opus 4.6
          (or any 3 models).
        </p>
        <div className="mt-6 flex gap-4">
          <Button onClick={() => router.push('/insights')}>
            View insights
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/agent-eval')}
          >
            Run evals
          </Button>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-10">
        <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {[
            { stat: `${savedRuns.length}`, label: 'Eval runs' },
            { stat: `${AGENT_TASKS.length}`, label: 'Coding tasks' },
            { stat: '6', label: 'Dimensions' },
            { stat: '2', label: 'Cross-provider judges' },
          ].map((item) => (
            <div key={item.label} className="bg-white px-5 py-4">
              <div className="text-2xl font-semibold text-black">{item.stat}</div>
              <div className="mt-1 text-sm font-medium text-black">{item.label}</div>
              {item.label === 'Eval runs' ? (
                <div className="mt-1 text-xs text-gray-500">
                  {singleShotRuns} single-shot, {shipFastRuns} ship_fast, {agentLoopRuns} agent loop
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Key Findings */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
          Key findings
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {findings.map((finding, i) => (
            <button
              key={i}
              onClick={() => router.push(finding.href)}
              className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-400"
            >
              <div>
                <h3 className="text-sm font-medium text-black">
                  {finding.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  {finding.description}
                </p>
              </div>
              <div className="mt-4 text-sm text-blue-600">Read more →</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
