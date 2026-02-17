import fs from 'fs';
import path from 'path';

const RUNS_DIR = path.join(process.cwd(), 'outputs', 'runs');
const JSON_OUT = path.join(process.cwd(), 'outputs', 'latest-run-metrics.json');
const MD_OUT = path.join(process.cwd(), 'outputs', 'latest-run-metrics.md');

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function toPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function loadRuns() {
  if (!fs.existsSync(RUNS_DIR)) return [];
  return fs
    .readdirSync(RUNS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf-8');
      return JSON.parse(raw);
    });
}

function summarize(runs) {
  const headToHead = runs.filter(
    (run) =>
      run.models.includes('gpt-5.3-codex') &&
      run.models.includes('claude-opus-4-6')
  );
  const codexWins = headToHead.filter((run) => run.winner === 'gpt-5.3-codex').length;
  const claudeWins = headToHead.filter((run) => run.winner === 'claude-opus-4-6').length;
  const avgGap = avg(
    headToHead.map((run) => {
      const codex = run.modelResults['gpt-5.3-codex']?.weightedScore || 0;
      const claude = run.modelResults['claude-opus-4-6']?.weightedScore || 0;
      return codex - claude;
    })
  );
  const avgAgreement = avg(
    headToHead.map((run) => run.interJudgeAgreement?.alignmentRate || 0)
  );
  const byMode = runs.reduce((acc, run) => {
    acc[run.mode] = (acc[run.mode] || 0) + 1;
    return acc;
  }, {});
  const byPreset = runs.reduce((acc, run) => {
    acc[run.weightPreset] = (acc[run.weightPreset] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    runCount: runs.length,
    headToHeadCount: headToHead.length,
    codexWins,
    claudeWins,
    averageWeightedGapCodexMinusClaude: avgGap,
    averageInterJudgeAgreement: avgAgreement,
    byMode,
    byPreset,
  };
}

function toMarkdown(summary) {
  return [
    '# Latest Run Metrics',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `- Total runs: ${summary.runCount}`,
    `- Head-to-head runs (Codex vs Opus): ${summary.headToHeadCount}`,
    `- Codex wins: ${summary.codexWins}`,
    `- Claude wins: ${summary.claudeWins}`,
    `- Average weighted gap (Codex - Claude): ${summary.averageWeightedGapCodexMinusClaude.toFixed(2)}`,
    `- Average inter-judge agreement: ${toPct(summary.averageInterJudgeAgreement)}`,
    '',
    '## By Mode',
    ...Object.entries(summary.byMode).map(([mode, count]) => `- ${mode}: ${count}`),
    '',
    '## By Preset',
    ...Object.entries(summary.byPreset).map(([preset, count]) => `- ${preset}: ${count}`),
    '',
  ].join('\n');
}

const runs = loadRuns();
const summary = summarize(runs);

fs.writeFileSync(JSON_OUT, JSON.stringify(summary, null, 2));
fs.writeFileSync(MD_OUT, toMarkdown(summary));

console.log(`Wrote ${JSON_OUT}`);
console.log(`Wrote ${MD_OUT}`);
