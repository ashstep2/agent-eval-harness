import { ModelResponse } from '@/types';
import { queryAnthropic, streamAnthropic } from './anthropic';
import { queryOpenAI, streamOpenAI } from './openai';
import { queryCodexCli, streamCodexCli } from './codex-cli';
import { getModelConfig } from '@/lib/data/models';

export async function queryModel(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse> {
  const config = getModelConfig(modelId);

  if (!config) {
    return { modelId, response: '', latencyMs: 0, error: `Unknown model: ${modelId}` };
  }

  // CLI models are invoked via a local subprocess instead of an API.
  if (config.type === 'cli') {
    return queryCodexCli(modelId, prompt, systemPrompt);
  }

  if (config.provider === 'anthropic') {
    return queryAnthropic(modelId, prompt, systemPrompt);
  } else if (config.provider === 'openai') {
    return queryOpenAI(modelId, prompt, systemPrompt);
  }

  return { modelId, response: '', latencyMs: 0, error: `Unsupported provider: ${config.provider}` };
}

export async function* streamModel(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<{ text: string; done: boolean }> {
  const config = getModelConfig(modelId);

  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (config.type === 'cli') {
    yield* streamCodexCli(modelId, prompt, systemPrompt);
  } else if (config.provider === 'anthropic') {
    yield* streamAnthropic(modelId, prompt, systemPrompt);
  } else if (config.provider === 'openai') {
    yield* streamOpenAI(modelId, prompt, systemPrompt);
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

// Query multiple models in parallel
export async function queryModelsParallel(
  modelIds: string[],
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse[]> {
  const promises = modelIds.map((modelId) =>
    queryModel(modelId, prompt, systemPrompt)
  );
  return Promise.all(promises);
}
