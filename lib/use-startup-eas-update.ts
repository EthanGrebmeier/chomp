import * as Updates from 'expo-updates';
import { useEffect } from 'react';

/** Download opportunistically; Expo applies the update on the next cold launch.
 * Never hold the splash or restart an active shopping session for an update. */
export const useStartupEasUpdate = () => {
  useEffect(() => {
    if (!Updates.isEnabled) return;
    let active = true;
    void Updates.checkForUpdateAsync()
      .then(update => {
        if (active && (update.isAvailable || update.isRollBackToEmbedded))
          return Updates.fetchUpdateAsync();
      })
      .catch(() => {
        // The installed bundle remains usable with no network.
      });
    return () => {
      active = false;
    };
  }, []);
};
