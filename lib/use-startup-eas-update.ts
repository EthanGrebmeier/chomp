import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

const STARTUP_UPDATE_TIMEOUT_MS = 5000;

class StartupUpdateTimeoutError extends Error {
  constructor(stage: string) {
    super(
      `Startup update stage "${stage}" timed out after ${STARTUP_UPDATE_TIMEOUT_MS}ms`
    );
    this.name = 'StartupUpdateTimeoutError';
  }
}

const describeStartupUpdateError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const logStartupUpdate = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[startup-update] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[startup-update] ${message}`, payload);
};

const withStartupUpdateTimeout = async <T,>(
  stage: string,
  task: () => Promise<T>
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task(),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new StartupUpdateTimeoutError(stage));
        }, STARTUP_UPDATE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

export const useStartupEasUpdate = () => {
  const [isReady, setIsReady] = useState(!Updates.isEnabled);

  useEffect(() => {
    if (!Updates.isEnabled) {
      return;
    }

    let isCancelled = false;

    const checkForStartupUpdate = async () => {
      let shouldStartApp = true;

      try {
        logStartupUpdate('checking for update');

        const update = await withStartupUpdateTimeout(
          'checkForUpdateAsync',
          () => Updates.checkForUpdateAsync()
        );

        logStartupUpdate('check complete', {
          isAvailable: update.isAvailable,
          isRollBackToEmbedded: update.isRollBackToEmbedded,
        });

        if (!update.isAvailable && !update.isRollBackToEmbedded) {
          return;
        }

        logStartupUpdate('fetching update');

        const fetchResult = await withStartupUpdateTimeout(
          'fetchUpdateAsync',
          () => Updates.fetchUpdateAsync()
        );

        logStartupUpdate('fetch complete', {
          isNew: fetchResult.isNew,
          isRollBackToEmbedded: fetchResult.isRollBackToEmbedded,
        });

        if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
          shouldStartApp = false;
          logStartupUpdate('reloading for fetched update');
          await withStartupUpdateTimeout('reloadAsync', () =>
            Updates.reloadAsync()
          );
        }
      } catch (error) {
        shouldStartApp = true;
        // Fail open so an update service or network issue never blocks auth.
        logStartupUpdate('failed open', {
          error: describeStartupUpdateError(error),
        });
      } finally {
        if (!isCancelled && shouldStartApp) {
          setIsReady(true);
        }
      }
    };

    void checkForStartupUpdate();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { isReady };
};
