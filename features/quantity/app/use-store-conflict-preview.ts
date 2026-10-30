import { useMemo } from 'react';

import {
  buildStoreConflictIndex,
  countStoreConflicts,
} from '../store-conflict-preview';

import { useQuantityList } from './session';

type IncomingItem = {
  name: string;
  unit: string;
  storeId?: string;
  store?: { id: string } | null;
};

/** Advisory only. Submission always rechecks the latest list before writing. */
export function useStoreConflictPreview(
  listId: string | undefined,
  items: IncomingItem[],
  defaultStoreId?: string
) {
  const session = useQuantityList(listId);
  const index = useMemo(
    () => buildStoreConflictIndex(session.state, listId ?? ''),
    [session.state, listId]
  );
  const count =
    listId && session.canEdit
      ? countStoreConflicts(
          index,
          items.map(item => ({
            name: item.name,
            unit: item.unit,
            store: item.storeId ?? item.store?.id ?? defaultStoreId ?? '',
          }))
        )
      : 0;
  return {
    count,
    needsReview: count > 0,
    label: count === 1 ? 'Review conflict' : 'Review conflicts',
  };
}
