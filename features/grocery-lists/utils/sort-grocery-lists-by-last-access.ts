/** Map of grocery list id → ISO timestamp of the last time it was opened. */
export type ListAccessTimes = Readonly<Record<string, string>>;

/**
 * Orders lists by when they were last opened on this device (most recent
 * first). Lists never opened keep their relative order at the end.
 */
export const sortGroceryListsByLastAccess = <T extends { id: string }>(
  lists: readonly T[],
  accessTimes: ListAccessTimes
): T[] =>
  [...lists].sort((a, b) => {
    const aTime = accessTimes[a.id];
    const bTime = accessTimes[b.id];

    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;

    return bTime.localeCompare(aTime);
  });

type ListWithLegacyShares = {
  id: string;
  shares?: { user_id: string; lastAccessedAt?: string }[];
};

/**
 * Reads the user's access times from the legacy server-synced
 * `grocery_list_shares.lastAccessedAt` field. Only used to seed device-local
 * access times once, so existing users keep their list order after upgrading.
 */
export const legacyListAccessTimesFromShares = (
  lists: readonly ListWithLegacyShares[],
  userId: string
): ListAccessTimes => {
  const accessTimes: Record<string, string> = {};

  for (const list of lists) {
    const lastAccessedAt = list.shares?.find(
      share => share.user_id === userId
    )?.lastAccessedAt;

    if (lastAccessedAt) {
      accessTimes[list.id] = lastAccessedAt;
    }
  }

  return accessTimes;
};
