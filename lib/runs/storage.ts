import fs from 'fs';
import path from 'path';
import { AgentEvaluationResults } from '@/types';

const RUNS_DIR = path.join(process.cwd(), 'outputs', 'runs');

/** Ensure the runs directory exists. */
function ensureDir() {
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

/** Save an evaluation run to disk as JSON. */
export function saveRun(run: AgentEvaluationResults): void {
  ensureDir();
  const filePath = path.join(RUNS_DIR, `${run.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2));
}

/** Load all saved runs, sorted newest first. */
export function loadAllRuns(): AgentEvaluationResults[] {
  ensureDir();

  const files = fs.readdirSync(RUNS_DIR).filter((f) => f.endsWith('.json'));
  const runs: AgentEvaluationResults[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf-8');
      runs.push(JSON.parse(raw) as AgentEvaluationResults);
    } catch {
      // Skip malformed files.
    }
  }

  return runs.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}
