import { useMemo } from 'react';

import { db } from '../../../lib/instant';
import { sortGroceryListsByLastAccess } from '../utils/sort-grocery-lists-by-last-access';

/**
 * Light query for the list picker: every list the user can see plus its
 * shares (needed for the "Shared" badge and last-access ordering).
 *
 * Items are intentionally NOT included here. Use `useGroceryListItems` for the
 * active list so a collaborator's edit on one list does not re-emit every list
 * on every device.
 */
export const useGroceryLists = () => {
  const { user } = db.useAuth();

  const groceryListsQuery = db.useQuery({
    grocery_lists: {
      shares: {},
    },
  });

  const sortedData = useMemo(() => {
    if (!groceryListsQuery.data || !user) {
      return groceryListsQuery.data;
    }

    return {
      ...groceryListsQuery.data,
      grocery_lists: sortGroceryListsByLastAccess(
        groceryListsQuery.data.grocery_lists,
        user.id
      ),
    };
  }, [groceryListsQuery.data, user]);

  return {
    ...groceryListsQuery,
    data: sortedData,
  };
};
