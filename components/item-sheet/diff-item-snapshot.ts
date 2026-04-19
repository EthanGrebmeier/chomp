export type ItemSnapshot = {
  name: string;
  category?: string;
  notes?: string;
  quantity: number;
  unit: string;
  storeId?: string;
};

export type ItemSnapshotDiff = Partial<ItemSnapshot>;

// Optional string fields treat "" and undefined as equivalent so an
// intermediate "cleared to empty" state doesn't register as a diff against a
// snapshot that had the field unset.
const normalizeOptionalString = (value: string | undefined | null): string =>
  (value ?? '').trim();

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

  if (
    normalizeOptionalString(snapshot.name) !==
    normalizeOptionalString(current.name)
  ) {
    diff.name = current.name;
  }

  if (
    normalizeOptionalString(snapshot.category) !==
    normalizeOptionalString(current.category)
  ) {
    diff.category = current.category;
  }

  if (
    normalizeOptionalString(snapshot.notes) !==
    normalizeOptionalString(current.notes)
  ) {
    diff.notes = current.notes;
  }

  if (
    normalizeOptionalString(snapshot.unit) !==
    normalizeOptionalString(current.unit)
  ) {
    diff.unit = current.unit;
  }

  if (
    normalizeOptionalString(snapshot.storeId) !==
    normalizeOptionalString(current.storeId)
  ) {
    diff.storeId = current.storeId;
  }

  if (snapshot.quantity !== current.quantity) {
    diff.quantity = current.quantity;
  }

  return diff;
};
