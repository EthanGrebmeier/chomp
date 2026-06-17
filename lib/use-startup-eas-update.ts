import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

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
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable && !update.isRollBackToEmbedded) {
          return;
        }

        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
          shouldStartApp = false;
          await Updates.reloadAsync();
        }
      } catch {
        shouldStartApp = true;
        // Fail open so an update service or network issue never blocks auth.
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
