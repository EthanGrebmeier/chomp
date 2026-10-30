import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import {
  completeStoreDestinations,
  inspectStoreConflicts,
  type StoreConflict,
  type StoreDecisions,
} from '../store-conflicts';
import type { Ingredient } from '../types';

import { listSession } from './session';

export type StoreReviewRequest = {
  conflicts: StoreConflict[];
  stores: Record<string, string>;
  changed: boolean;
};
export type StoreReviewer = (
  request: StoreReviewRequest
) => Promise<StoreDecisions>;
let reviewer: StoreReviewer | undefined;
export function registerStoreReviewer(next: StoreReviewer) {
  reviewer = next;
  return () => {
    if (reviewer === next) reviewer = undefined;
  };
}

export async function chooseItemDestinations(
  listId: string,
  ingredients: Ingredient[],
  review: StoreReviewer | undefined = reviewer
) {
  let changed = false;
  for (;;) {
    const inspected = inspectStoreConflicts(
      listSession(listId).state,
      listId,
      ingredients
    );
    if (!inspected.conflicts.length)
      return completeStoreDestinations(
        listId,
        ingredients,
        inspected.destinations,
        id
      );
    const { data } = await db.queryOnce({ stores: {} });
    if (!review)
      throw new Error(
        'Store review is unavailable. Reopen the list and try again.'
      );
    const decisions = await review({
      conflicts: inspected.conflicts,
      stores: Object.fromEntries(
        data.stores.map(store => [store.id, store.name])
      ),
      changed,
    });
    const fresh = inspectStoreConflicts(
      listSession(listId).state,
      listId,
      ingredients
    );
    if (JSON.stringify(fresh) !== JSON.stringify(inspected)) {
      changed = true;
      continue;
    }
    // A store decision moves the whole row, including automatically matched additions.
    const movedStores = new Map(
      Object.values(decisions)
        .filter(d => d.rowId)
        .map(d => [d.rowId, d.store])
    );
    const automatic = Object.fromEntries(
      Object.entries(inspected.destinations).map(([key, destination]) => [
        key,
        destination.rowId && movedStores.has(destination.rowId)
          ? { ...destination, store: movedStores.get(destination.rowId) }
          : destination,
      ])
    );
    return completeStoreDestinations(
      listId,
      ingredients,
      { ...automatic, ...decisions },
      id
    );
  }
}
