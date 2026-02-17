import Anthropic from '@anthropic-ai/sdk';
import { ModelResponse } from '@/types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export async function queryAnthropic(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse> {
  const anthropic = getClient();
  const startTime = Date.now();

  try {
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt || undefined,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const latencyMs = Date.now() - startTime;

    // Extract text from the response
    const textContent = message.content.find((block) => block.type === 'text');
    const response = textContent?.type === 'text' ? textContent.text : '';

    return {
      modelId,
      response,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId,
      response: '',
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function* streamAnthropic(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<{ text: string; done: boolean }> {
  const anthropic = getClient();

  try {
    const stream = await anthropic.messages.stream({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt || undefined,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { text: event.delta.text, done: false };
      }
    }

    yield { text: '', done: true };
  } catch (error) {
    throw error;
  }
}
