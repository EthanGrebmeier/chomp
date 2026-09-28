import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

// Total time the splash screen may wait on the network for an OTA update,
// shared across the check and fetch stages so a weak signal can't stack
// timeouts. A fetch that runs past the budget keeps downloading in the
// background and is applied on the next cold launch.
const STARTUP_UPDATE_NETWORK_BUDGET_MS = 5000;
const STARTUP_UPDATE_RELOAD_TIMEOUT_MS = 5000;

class StartupUpdateTimeoutError extends Error {
  constructor(stage: string, timeoutMs: number) {
    super(`Startup update stage "${stage}" timed out after ${timeoutMs}ms`);
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
  timeoutMs: number,
  task: () => Promise<T>
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  if (timeoutMs <= 0) {
    throw new StartupUpdateTimeoutError(stage, timeoutMs);
  }

  try {
    return await Promise.race([
      task(),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new StartupUpdateTimeoutError(stage, timeoutMs));
        }, timeoutMs);
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
      const networkDeadline = Date.now() + STARTUP_UPDATE_NETWORK_BUDGET_MS;
      const getRemainingNetworkBudget = () => networkDeadline - Date.now();

      try {
        logStartupUpdate('checking for update');

        const update = await withStartupUpdateTimeout(
          'checkForUpdateAsync',
          getRemainingNetworkBudget(),
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
          getRemainingNetworkBudget(),
          () => Updates.fetchUpdateAsync()
        );

        logStartupUpdate('fetch complete', {
          isNew: fetchResult.isNew,
          isRollBackToEmbedded: fetchResult.isRollBackToEmbedded,
        });

        if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
          shouldStartApp = false;
          logStartupUpdate('reloading for fetched update');
          await withStartupUpdateTimeout(
            'reloadAsync',
            STARTUP_UPDATE_RELOAD_TIMEOUT_MS,
            () => Updates.reloadAsync()
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
