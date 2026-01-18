import { useMemo } from 'react';

import { db } from '../../../lib/instant';

export const useGroceryLists = () => {
  const { user } = db.useAuth();

  const groceryListsQuery = db.useQuery(
    {
      grocery_lists: {
        shares: {},
        grocery_items: {
          $: {
            where: {
              isDeleted: false,
            },
          },
          recipe: {},
          store: {},
        },
      },
    }
  );

  // Sort grocery lists by lastAccessedAt (most recent first)
  const sortedData = useMemo(() => {
    if (!groceryListsQuery.data || !user) {
      return groceryListsQuery.data;
    }

    const sortedLists = [...groceryListsQuery.data.grocery_lists].sort(
      (a, b) => {
        // Find the current user's share record for each list
        const aShare = a.shares?.find(share => share.user_id === user.id);
        const bShare = b.shares?.find(share => share.user_id === user.id);

        // Get lastAccessedAt timestamps
        const aTime = aShare?.lastAccessedAt;
        const bTime = bShare?.lastAccessedAt;

        // Lists without lastAccessedAt appear at the end
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;

        // Sort by most recent first (descending)
        return bTime.localeCompare(aTime);
      }
    );

    return {
      ...groceryListsQuery.data,
      grocery_lists: sortedLists,
    };
  }, [groceryListsQuery.data, user]);

  return {
    ...groceryListsQuery,
    data: sortedData,
  };
};
