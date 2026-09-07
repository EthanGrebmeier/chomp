import { useCallback } from 'react';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export const useTrackListAccess = () => {
  // Stable identity: callers put this in effect deps, so a fresh function on
  // every render would turn write -> re-emit -> render into a loop.
  const trackListAccess = useCallback(async (listId: string) => {
    try {
      const user = await db.getAuth();
      if (!user) {
        return;
      }

      // Only fetch the shares for this list, not every share the user can see.
      const result = await db.queryOnce({
        grocery_list_shares: {
          $: {
            where: {
              'grocery_list.id': listId,
            },
          },
        },
      });

      const userShare = result.data.grocery_list_shares.find(
        share => share.user_id === user.id
      );

      if (!userShare) {
        return;
      }

      // Update only the lastAccessedAt field to enforce field-level restrictions
      await db.transact([
        db.tx.grocery_list_shares[userShare.id].update(
          trimStringFields({
            lastAccessedAt: new Date().toISOString(),
          })
        ),
      ]);
    } catch (error) {
      console.error('Failed to track list access:', error);
    }
  }, []);

  return trackListAccess;
};
