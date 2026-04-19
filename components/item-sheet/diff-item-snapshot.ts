export type ItemSnapshot = {
  name: string;
  category?: string;
  notes?: string;
  quantity: number;
  unit: string;
  storeId?: string;
};

export type ItemSnapshotDiff = Partial<ItemSnapshot>;

// Treats "" / whitespace / undefined as equivalent so an intermediate
// "cleared to empty" state doesn't register as a diff against a snapshot
// that had the field unset.
const normalizeString = (value: string | undefined | null): string =>
  (value ?? '').trim();

const STRING_FIELDS = [
  'name',
  'category',
  'notes',
  'unit',
  'storeId',
] as const satisfies readonly (keyof ItemSnapshot)[];

/**
 * Returns a partial object containing only the fields that differ between the
 * snapshot and current state. String fields compare after trimming so trailing
 * whitespace does not register as a diff. Returns an empty object when nothing
 * has changed.
 */
export const diffItemSnapshot = ({
  snapshot,
  current,
}: {
  snapshot: ItemSnapshot;
  current: ItemSnapshot;
}): ItemSnapshotDiff => {
  const diff: ItemSnapshotDiff = {};

  for (const field of STRING_FIELDS) {
    const snapshotValue = snapshot[field] as string | undefined;
    const currentValue = current[field] as string | undefined;
    if (normalizeString(snapshotValue) !== normalizeString(currentValue)) {
      // Preserve the raw current value (not trimmed); writers trim at persist time.
      diff[field] = currentValue;
    }
  }

  if (snapshot.quantity !== current.quantity) {
    diff.quantity = current.quantity;
  }

  return diff;
};
