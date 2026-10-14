import { useCallback } from 'react';

import { db } from '@/lib/instant';

import { recordListAccess } from './list-access-store';

/** Records that the current user opened a list on this device. */
export const useTrackListAccess = () => {
  const { user } = db.useAuth();
  const userId = user?.id;

  // Stable identity: callers put this in effect deps.
  return useCallback(
    (listId: string) => {
      if (userId) {
        recordListAccess(userId, listId);
      }
    },
    [userId]
  );
};
