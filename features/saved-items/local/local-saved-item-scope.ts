export type LocalSavedItemScopeRow = {
  name: string;
  ownerId: string | null;
  isDefault: boolean;
};

export const normalizeLocalSavedItemOwnerId = (
  ownerId: string | null | undefined
) => ownerId ?? null;

export const isLocalSavedItemVisibleForOwner = (
  item: LocalSavedItemScopeRow,
  ownerId: string | null | undefined
) => {
  const normalizedOwnerId = normalizeLocalSavedItemOwnerId(ownerId);

  return item.isDefault || item.ownerId === normalizedOwnerId;
};

export const dedupeLocalSavedItemsForOwner = <
  T extends LocalSavedItemScopeRow,
>(
  items: T[],
  ownerId: string | null | undefined
) => {
  const byName = new Map<string, T>();

  for (const item of items) {
    if (!isLocalSavedItemVisibleForOwner(item, ownerId)) {
      continue;
    }

    const key = item.name.trim().toLowerCase();
    const existing = byName.get(key);

    if (!existing || (existing.isDefault && !item.isDefault)) {
      byName.set(key, item);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};
