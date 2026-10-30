import { normalize, records } from './model';
import type { Ingredient, QuantityState } from './types';

export type StoreConflictIndex = Map<string, Set<string>>;
const matchKey = (name: string, unit: string) =>
  JSON.stringify([normalize(name), unit]);

/** Only row identity and stores matter for preview; never replay quantities. */
export function buildStoreConflictIndex(
  state: QuantityState,
  listId: string
): StoreConflictIndex {
  const index: StoreConflictIndex = new Map();
  for (const row of records(state, 'row')) {
    if (row.listId !== listId || row.status !== 'active') continue;
    const key = matchKey(row.name, row.unit);
    const stores = index.get(key) ?? new Set<string>();
    stores.add(row.store);
    index.set(key, stores);
  }
  return index;
}

/** An exact store match wins even when there are rows at other stores. */
export function needsStoreReview(stores: ReadonlySet<string>, store: string) {
  return stores.size > 0 && !stores.has(store);
}

export function countStoreConflicts(
  index: StoreConflictIndex,
  items: Pick<Ingredient, 'name' | 'unit' | 'store'>[]
) {
  return items.filter(item => {
    const stores = index.get(matchKey(item.name, normalize(item.unit)));
    return stores !== undefined && needsStoreReview(stores, item.store);
  }).length;
}
