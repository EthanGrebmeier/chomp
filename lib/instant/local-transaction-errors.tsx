import { useEffect } from 'react';
import { toast } from 'sonner-native';

import { db } from '.';

/** Includes rejected queued writes restored from disk, after their form closed. */
export function LocalTransactionErrors() {
  useEffect(
    () =>
      db.core._reactor.__subscribeMutationErrors(() => {
        toast.error('Some changes could not sync. Review your latest edits.');
      }),
    []
  );
  return null;
}
