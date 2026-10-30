import { normalize, totalFor } from './model';
import { matchingRows, type Destination, type NewId } from './shopping';
import { needsStoreReview } from './store-conflict-preview';
import type {
  Ingredient,
  QuantityState,
  ShoppingRow,
  Versioned,
} from './types';

export type StoreConflict = {
  item: Ingredient;
  rows: { row: Versioned<ShoppingRow>; quantity: number }[];
};
export type StoreDecisions = Record<string, Destination>;

/** Prefer an exact store match before asking about any other stores. */
export function inspectStoreConflicts(
  state: QuantityState,
  listId: string,
  ingredients: Ingredient[]
) {
  const destinations: StoreDecisions = {};
  const conflicts: StoreConflict[] = [];
  for (const item of ingredients) {
    const rows = matchingRows(state, listId, item).sort(
      (a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
        a.id.localeCompare(b.id)
    );
    const exact = rows.find(row => row.store === item.store);
    if (exact) destinations[item.id] = { rowId: exact.id, store: exact.store };
    else if (needsStoreReview(new Set(rows.map(row => row.store)), item.store))
      conflicts.push({
        item,
        rows: rows.map(row => ({
          row,
          quantity: totalFor(state, row.id) ?? 0,
        })),
      });
  }
  return { destinations, conflicts };
}

/** Reserve one new row per automatic group; explicit Keep separate stays separate. */
export function completeStoreDestinations(
  listId: string,
  ingredients: Ingredient[],
  destinations: StoreDecisions,
  newId: NewId
): StoreDecisions {
  const result = { ...destinations };
  const groups = new Map<string, ShoppingRow>();
  const storesByTarget = new Map<string, string | undefined>();
  for (const item of ingredients) {
    const destination = result[item.id];
    if (destination) {
      if (destination.rowId) {
        if (
          storesByTarget.has(destination.rowId) &&
          storesByTarget.get(destination.rowId) !== destination.store
        )
          throw new Error(
            'Choose the same store for items being combined into the same row.'
          );
        storesByTarget.set(destination.rowId, destination.store);
      }
      continue;
    }
    const key = JSON.stringify([
      normalize(item.name),
      normalize(item.unit),
      item.store,
    ]);
    let row = groups.get(key);
    if (!row) {
      row = {
        kind: 'row',
        id: newId(),
        listId,
        name: item.name.trim(),
        unit: normalize(item.unit),
        store: item.store,
        notes: item.notes,
        category: item.category,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      groups.set(key, row);
    }
    result[item.id] = { newRow: row };
  }
  return result;
}
