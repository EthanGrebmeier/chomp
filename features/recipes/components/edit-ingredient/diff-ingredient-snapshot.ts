import {
  diffItemSnapshot,
  type ItemSnapshot,
  type ItemSnapshotDiff,
} from '@/components/item-sheet/diff-item-snapshot';

// Recipe ingredients share the same field shape as grocery items for diffing
// purposes, so we delegate to the shared helper. The alias exists so the
// edit-ingredient subfolder is self-contained and imports read naturally.
export type IngredientSnapshot = ItemSnapshot;
export type IngredientSnapshotDiff = ItemSnapshotDiff;

/**
 * Returns the subset of ingredient fields that changed between `snapshot` and
 * `current`. String fields (name, category, notes, unit, storeId) use trim-
 * normalized comparison; empty string, whitespace, and `undefined` are all
 * treated as equivalent for optional fields. Quantity compares as numeric
 * equality.
 */
export const diffIngredientSnapshot = ({
  snapshot,
  current,
}: {
  snapshot: IngredientSnapshot;
  current: IngredientSnapshot;
}): IngredientSnapshotDiff =>
  diffItemSnapshot({ snapshot, current });
