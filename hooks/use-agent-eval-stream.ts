'use client';

import { useCallback, useRef, useState } from 'react';
import { AgentEvaluationResults, AgentStreamEvent, AgentEvalMode, WeightPreset } from '@/types';
import { useAgentEvalStore } from '@/store/agent-eval-store';

interface UseAgentEvalStreamOptions {
  onComplete?: (results: AgentEvaluationResults) => void;
  onError?: (error: string) => void;
}

export function useAgentEvalStream(options: UseAgentEvalStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    startEvaluation,
    updateProgress,
    addResponse,
    addStep,
    completeEvaluation,
    failEvaluation,
  } = useAgentEvalStore();

  const startStream = useCallback(
    async (
      taskId: string,
      modelIds: string[],
      mode: AgentEvalMode,
      weightPreset: WeightPreset,
      customWeights?: Record<string, number>
    ) => {
      setError(null);
      setIsConnected(false);
      startEvaluation();
      abortControllerRef.current = new AbortController();

      try {
        const startResponse = await fetch('/api/agent-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            models: modelIds,
            mode,
            weightPreset,
            customWeights,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!startResponse.ok) {
          const errorData = await startResponse.json();
          throw new Error(errorData.error || 'Failed to start evaluation');
        }

        const { evaluationId } = await startResponse.json();
        const params = new URLSearchParams({
          taskId,
          models: modelIds.join(','),
          mode,
          weightPreset,
        });
        if (customWeights) {
          params.set('customWeights', JSON.stringify(customWeights));
        }

        const eventSource = new EventSource(
          `/api/agent-eval/${evaluationId}/stream?${params}`
        );
        eventSourceRef.current = eventSource;
        setIsConnected(true);

        eventSource.onmessage = (event) => {
          try {
            const streamEvent: AgentStreamEvent = JSON.parse(event.data);
            switch (streamEvent.type) {
              case 'progress':
                updateProgress(streamEvent.data);
                break;
              case 'response':
                addResponse(
                  streamEvent.data.modelId,
                  streamEvent.data.text,
                  streamEvent.data.stepId
                );
                break;
              case 'step':
                addStep(streamEvent.data);
                break;
              case 'complete':
                completeEvaluation(streamEvent.data);
                eventSource.close();
                setIsConnected(false);
                options.onComplete?.(streamEvent.data);
                break;
              case 'error':
                setError(streamEvent.data.message);
                failEvaluation(streamEvent.data.message);
                eventSource.close();
                setIsConnected(false);
                options.onError?.(streamEvent.data.message);
                break;
            }
          } catch (e) {
            console.error('Failed to parse stream event:', e);
          }
        };

        eventSource.onerror = () => {
          setError('Connection lost');
          eventSource.close();
          setIsConnected(false);
        };

        return evaluationId;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          return null;
        }
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
        failEvaluation(errorMessage);
        options.onError?.(errorMessage);
        return null;
      }
    }, 
    [
      startEvaluation,
      updateProgress,
      addResponse,
      addStep,
      completeEvaluation,
      failEvaluation,
      options,
    ]
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return { isConnected, error, startStream, stopStream };
}
