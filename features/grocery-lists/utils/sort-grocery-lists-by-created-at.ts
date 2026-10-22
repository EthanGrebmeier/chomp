/**
 * Orders lists oldest first, so the order is stable and only changes when a
 * list is created, joined or removed.
 */
export const sortGroceryListsByCreatedAt = <T extends { createdAt: string }>(
  lists: readonly T[]
): T[] => [...lists].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
