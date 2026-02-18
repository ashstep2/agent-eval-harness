import { ModelConfig } from '@/types';

export const MODELS: ModelConfig[] = [
  {
    provider: 'openai',
    modelId: 'gpt-5.3-codex',
    displayName: 'GPT-5.3 Codex',
    description: "OpenAI's coding-optimized variant -- requires local Codex CLI",
    type: 'cli',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    description: 'Latest Sonnet -- fast, high-capability',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    description: 'Latest Claude Opus model',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.2',
    displayName: 'GPT-5.2',
    description: "OpenAI's most capable base model",
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-5-20251101',
    displayName: 'Claude Opus 4.5',
    description: 'Most capable Claude model',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    description: 'Balance of speed and capability',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5-mini',
    displayName: 'GPT-5 Mini',
    description: 'Balanced performance and speed',
  },
  {
    provider: 'openai',
    modelId: 'gpt-5-nano',
    displayName: 'GPT-5 Nano',
    description: 'Fastest, lowest cost',
  },
  {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude Haiku 3.5',
    description: 'Fastest Claude model',
  },
];

export const MODEL_MAP: Record<string, ModelConfig> = MODELS.reduce(
  (acc, model) => {
    acc[model.modelId] = model;
    return acc;
  },
  {} as Record<string, ModelConfig>
);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_MAP[modelId];
}

export function getModelDisplayName(modelId: string): string {
  return MODEL_MAP[modelId]?.displayName || modelId;
}

export function getModelsByProvider(provider: 'anthropic' | 'openai'): ModelConfig[] {
  return MODELS.filter((m) => m.provider === provider);
}
