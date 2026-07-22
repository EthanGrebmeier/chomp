type CreateInstantAuthBridgeArgs = {
  signInWithIdToken: (idToken: string) => Promise<unknown>;
  retryCount?: number;
  retryBaseDelayMs?: number;
  stepTimeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  onAttemptFailed?: (event: {
    attempt: number;
    canRetry: boolean;
    error: unknown;
  }) => void;
};

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 750;
const DEFAULT_STEP_TIMEOUT_MS = 15000;

const defaultSleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

class BridgeTimeoutError extends Error {
  constructor(step: string, timeoutMs: number) {
    super(`Instant bridge step "${step}" timed out after ${timeoutMs}ms`);
    this.name = 'BridgeTimeoutError';
  }
}

export class InstantBridgeError extends Error {
  readonly isTimeout: boolean;
  readonly cause?: unknown;

  constructor(
    message: string,
    options?: { isTimeout?: boolean; cause?: unknown }
  ) {
    super(message);
    this.name = 'InstantBridgeError';
    this.isTimeout = options?.isTimeout ?? false;
    this.cause = options?.cause;
  }
}

const withTimeout = async <T>(
  step: string,
  timeoutMs: number,
  task: () => Promise<T>
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task(),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new BridgeTimeoutError(step, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const isTimeoutLikeError = (error: unknown) => {
  if (error instanceof BridgeTimeoutError) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  return /timed out|timeout|network|fetch failed|offline/i.test(message);
};

export const createInstantAuthBridge = ({
  signInWithIdToken,
  retryCount = DEFAULT_RETRY_COUNT,
  retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
  stepTimeoutMs = DEFAULT_STEP_TIMEOUT_MS,
  sleep = defaultSleep,
  onAttemptFailed,
}: CreateInstantAuthBridgeArgs) => {
  let activeBridgePromise: Promise<void> | null = null;

  const runBridge = async (getToken: () => Promise<string | null>) => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
      try {
        const idToken = await withTimeout(
          'clerk.getToken',
          stepTimeoutMs,
          getToken
        );

        if (!idToken) {
          throw new Error('Missing Clerk ID token');
        }

        await withTimeout('instant.signInWithIdToken', stepTimeoutMs, () =>
          signInWithIdToken(idToken)
        );
        return;
      } catch (error) {
        lastError = error;
        const canRetry = attempt < retryCount && isTimeoutLikeError(error);
        onAttemptFailed?.({ attempt, canRetry, error });

        if (!canRetry) {
          break;
        }

        await sleep(retryBaseDelayMs * attempt);
      }
    }

    throw new InstantBridgeError('Clerk to Instant bridge failed', {
      isTimeout: isTimeoutLikeError(lastError),
      cause: lastError,
    });
  };

  return (getToken: () => Promise<string | null>) => {
    if (activeBridgePromise) {
      return activeBridgePromise;
    }

    activeBridgePromise = runBridge(getToken).finally(() => {
      activeBridgePromise = null;
    });

    return activeBridgePromise;
  };
};
