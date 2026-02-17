import { execFile } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ModelResponse } from '@/types';

const CODEX_BIN = 'codex';
const TIMEOUT_MS = 300_000; // 5 minutes — CLI tasks can be slow

/** Check whether the codex binary is on PATH. */
function codexExists(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', [CODEX_BIN], (err) => resolve(!err));
  });
}

/**
 * Run a prompt through `codex exec` (non-interactive mode).
 *
 * Uses --output-last-message to write the agent's final response to a temp
 * file, which we read back. This avoids parsing stdout which may contain
 * progress/status output mixed with the actual response.
 */
function runCli(prompt: string): Promise<string> {
  const outFile = join(tmpdir(), `codex-eval-${randomUUID()}.txt`);

  return new Promise((resolve, reject) => {
    execFile(
      CODEX_BIN,
      [
        'exec',
        '-m', 'gpt-5.3-codex',
        '--output-last-message', outFile,
        '--full-auto',
        prompt,
      ],
      { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      async (err, _stdout, stderr) => {
        if (err) {
          // Clean up temp file on error.
          await unlink(outFile).catch(() => {});
          reject(new Error(stderr || err.message));
          return;
        }

        try {
          const output = await readFile(outFile, 'utf-8');
          await unlink(outFile).catch(() => {});
          resolve(output);
        } catch {
          // If the output file doesn't exist, fall back to stdout.
          await unlink(outFile).catch(() => {});
          resolve(_stdout);
        }
      }
    );
  });
}

/**
 * Query GPT-5.3 Codex by spawning the local Codex CLI.
 * Returns a ModelResponse in the same shape as the API adapters.
 */
export async function queryCodexCli(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse> {
  const startTime = Date.now();

  // Safety check: verify the CLI is installed.
  // If not, fall back to querying codex-mini-latest via the OpenAI API.
  const installed = await codexExists();
  if (!installed) {
    const { queryOpenAI } = await import('./openai');
    const result = await queryOpenAI('codex-mini-latest', prompt, systemPrompt);
    return {
      ...result,
      modelId,
      latencyMs: Date.now() - startTime,
    };
  }

  // If a system prompt is provided, prepend it to the user prompt.
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  try {
    console.log(`[CodexCLI] Running prompt (${fullPrompt.length} chars)...`);
    const output = await runCli(fullPrompt);
    const latencyMs = Date.now() - startTime;

    console.log(`[CodexCLI] Done in ${latencyMs}ms, output: ${output.length} chars`);

    return {
      modelId,
      response: output,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'CLI process failed';
    console.error(`[CodexCLI] Error:`, message);
    return {
      modelId,
      response: '',
      latencyMs,
      error: message,
    };
  }
}

/**
 * "Stream" the Codex CLI output.
 *
 * The CLI doesn't support token-by-token streaming, so we run the full
 * command and yield the output as a single chunk. This keeps the
 * AsyncGenerator interface consistent with the API adapters.
 */
export async function* streamCodexCli(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<{ text: string; done: boolean }> {
  const result = await queryCodexCli(modelId, prompt, systemPrompt);

  if (result.error) {
    throw new Error(result.error);
  }

  yield { text: result.response, done: false };
  yield { text: '', done: true };
}
