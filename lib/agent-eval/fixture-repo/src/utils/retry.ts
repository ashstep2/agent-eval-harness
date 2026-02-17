type RetryError = Error & { retryable?: boolean; nonRetryable?: boolean };

export type RetryOptions = {
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitter?: number;
  isRetryable?: (error: Error, attempt: number) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(
  error: Error,
  attempt: number,
  isRetryable?: (error: Error, attempt: number) => boolean
): boolean {
  if (isRetryable) {
    return isRetryable(error, attempt);
  }
  const retryError = error as RetryError;
  if (retryError.nonRetryable === true) return false;
  if (retryError.retryable === false) return false;
  return true;
}

function toError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(String(err));
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = Number.isFinite(attempts) ? Math.max(1, Math.floor(attempts)) : 1;
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 100);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 10_000);
  const backoffFactor = Math.max(1, options.backoffFactor ?? 2);
  const jitter = Math.max(0, Math.min(options.jitter ?? 0.2, 1));

  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = toError(err);
      const attempt = i + 1;
      const hasAttemptsRemaining = attempt < maxAttempts;

      if (!isRetryableError(lastError, attempt, options.isRetryable)) {
        throw lastError;
      }

      if (!hasAttemptsRemaining) {
        break;
      }

      const exponentialDelay = Math.min(
        maxDelayMs,
        baseDelayMs * backoffFactor ** i
      );
      const jitterMultiplier = 1 + (Math.random() * 2 - 1) * jitter;
      const delayMs = Math.max(0, Math.round(exponentialDelay * jitterMultiplier));

      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Failed after retries');
}
