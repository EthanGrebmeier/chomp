export type SavedItemSnapshot = {
  name: string;
  category?: string;
  storeId?: string;
};

export type SavedItemSnapshotDiff = Partial<SavedItemSnapshot>;

const normalizeString = (value: string | undefined | null): string =>
  (value ?? '').trim();

const STRING_FIELDS = ['name', 'category', 'storeId'] as const satisfies readonly (
  keyof SavedItemSnapshot
)[];

export const diffSavedItemSnapshot = ({
  snapshot,
  current,
}: {
  snapshot: SavedItemSnapshot;
  current: SavedItemSnapshot;
}): SavedItemSnapshotDiff => {
  const diff: SavedItemSnapshotDiff = {};

  for (const field of STRING_FIELDS) {
    const snapshotValue = snapshot[field] as string | undefined;
    const currentValue = current[field] as string | undefined;

    if (normalizeString(snapshotValue) !== normalizeString(currentValue)) {
      diff[field] = currentValue;
    }
  }

  return diff;
};
