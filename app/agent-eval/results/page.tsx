'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReportCard } from '@/components/agent-eval/report-card';
import { RadarChart } from '@/components/agent-eval/radar-chart';
import { JudgeAgreement } from '@/components/agent-eval/judge-agreement';
import { ScoreTable } from '@/components/agent-eval/score-table';
import { ModelResponsePanel } from '@/components/agent-eval/model-response-panel';
import { useAgentEvalStore } from '@/store/agent-eval-store';

function AgentEvalResultsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const runId = params.get('runId');

  const { results, savedRuns, loadRuns } = useAgentEvalStore();

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const currentResults = useMemo(() => {
    if (runId) {
      return savedRuns.find((run) => run.id === runId) || results;
    }
    return results || savedRuns[0] || null;
  }, [runId, results, savedRuns]);

  if (!currentResults) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h2 className="mb-2 text-lg font-semibold text-black">No results found</h2>
        <p className="mb-8 text-gray-500">Run a new evaluation to see results.</p>
        <Button onClick={() => router.push('/agent-eval')}>Back to tasks</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/agent-eval')}
            className="mb-4 text-sm text-gray-400 hover:text-black"
          >
            ← Back to tasks
          </button>
          <h1 className="text-2xl font-semibold text-black">Agent Report Card</h1>
          <p className="mt-1 text-sm text-gray-500">{currentResults.taskTitle}</p>
        </div>
        <Button onClick={() => router.push('/agent-eval')}>New evaluation</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ReportCard results={currentResults} />
        <JudgeAgreement alignmentRate={currentResults.interJudgeAgreement.alignmentRate} />
      </div>

      <div className="mt-10">
        <ModelResponsePanel results={currentResults} />
      </div>

      <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-gray-400">
          Dimension radar
        </h2>
        <RadarChart results={currentResults.modelResults} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
          Dimension breakdown
        </h2>
        <ScoreTable results={currentResults} />
      </div>
    </div>
  );
}

export default function AgentEvalResults() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-6 py-20 text-center text-gray-400">Loading results...</div>}>
      <AgentEvalResultsContent />
    </Suspense>
  );
}
