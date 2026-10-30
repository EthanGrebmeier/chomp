import { useEffect, useMemo } from 'react';

import { db } from '../../../lib/instant';
import {
  seedListAccessTimes,
  useListAccessTimes,
} from '../local/list-access-store';
import {
  legacyListAccessTimesFromShares,
  sortGroceryListsByLastAccess,
} from '../utils/sort-grocery-lists-by-last-access';

/**
 * Light query for the list picker: every list the user can see plus its
 * shares (needed for the "Shared" badge).
 *
 * Lists are ordered by this device's local last-access times, so another
 * device signed into the same account can't reorder them.
 *
 * Items are intentionally NOT included here. Use `useGroceryListItems` for the
 * active list so a collaborator's edit on one list does not re-emit every list
 * on every device.
 */
export const useGroceryLists = () => {
  const { user } = db.useAuth();
  const userId = user?.id;

  const groceryListsQuery = db.useQuery(
    user
      ? {
          grocery_lists: {
            shares: {},
          },
        }
      : null
  );
  const listAccess = useListAccessTimes(userId);
  const groceryLists = groceryListsQuery.data?.grocery_lists;

  useEffect(() => {
    if (userId && groceryLists && listAccess.isHydrated) {
      seedListAccessTimes(
        userId,
        legacyListAccessTimesFromShares(groceryLists, userId)
      );
    }
  }, [groceryLists, listAccess.isHydrated, userId]);

  const sortedData = useMemo(() => {
    if (!groceryListsQuery.data || !userId) {
      return groceryListsQuery.data;
    }

    return {
      ...groceryListsQuery.data,
      grocery_lists: sortGroceryListsByLastAccess(
        groceryListsQuery.data.grocery_lists,
        listAccess.accessTimes
      ),
    };
  }, [groceryListsQuery.data, listAccess.accessTimes, userId]);

  // Hold loading until the local order is ready (hydrated and, on first run,
  // seeded) so the home screen doesn't default to — and track — the wrong list.
  const isOrderPending =
    !!userId &&
    (!listAccess.isHydrated || (!!groceryLists && !listAccess.hasLocalValue));

  return {
    ...groceryListsQuery,
    isLoading: groceryListsQuery.isLoading || isOrderPending,
    data: isOrderPending ? undefined : sortedData,
  };
};
