import { AgentTask } from '@/types';

export function buildContextBlock(task: AgentTask): string {
  return task.contextFiles
    .map((file) => {
      const notes = file.notes ? `\nNotes: ${file.notes}` : '';
      return `File: ${file.path}${notes}\n\n${file.content}`;
    })
    .join('\n\n---\n\n');
}

export function buildSingleShotPrompt(task: AgentTask): string {
  return `You are a coding agent. Your job is to modify the repo files to complete the task.

Task: ${task.title}
Product question: ${task.productQuestion}

Instructions:
- Return a unified diff patch only for repo files.
- After the patch, include a short explanation (3-6 bullets).
- Be concise and follow existing repo style.

Repo context:
${buildContextBlock(task)}

Task details:
${task.prompt}

Expected behavior:
${task.expectedBehavior}
`;
}

export function buildStepPrompt(task: AgentTask, step: string, priorOutput?: string): string {
  const base = `You are a coding agent running in multi-step mode.

Task: ${task.title}
Product question: ${task.productQuestion}

Repo context:
${buildContextBlock(task)}

Task details:
${task.prompt}

Expected behavior:
${task.expectedBehavior}
`;

  switch (step) {
    case 'analyze':
      return `${base}\nStep 1: Read and analyze relevant files. Summarize key constraints and risks.`;
    case 'plan':
      return `${base}\nStep 2: Propose a step-by-step plan. Be specific.`;
    case 'code':
      return `${base}\nStep 3: Produce the patch for the code changes. Return a unified diff patch only.`;
    case 'review':
      return `${base}\nStep 4: Self-review the patch. Identify risks, edge cases, and possible regressions.`;
    case 'final':
      return `${base}\nStep 5: Return the final patch and a concise explanation. If revising from prior steps, incorporate improvements.\n\nPrior output:\n${priorOutput ?? ''}`;
    default:
      return base;
  }
}
