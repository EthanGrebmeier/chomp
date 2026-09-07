type ShareAccess = {
  user_id: string;
  lastAccessedAt?: string;
};

type ListWithShares = {
  shares?: ShareAccess[];
};

/**
 * Orders lists by the current user's own `lastAccessedAt` (most recent first).
 * Lists the user has never opened keep their relative order at the end.
 */
export const sortGroceryListsByLastAccess = <T extends ListWithShares>(
  lists: readonly T[],
  userId: string
): T[] => {
  const lastAccessedAtFor = (list: T) =>
    list.shares?.find(share => share.user_id === userId)?.lastAccessedAt;

  return [...lists].sort((a, b) => {
    const aTime = lastAccessedAtFor(a);
    const bTime = lastAccessedAtFor(b);

    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;

    return bTime.localeCompare(aTime);
  });
};
