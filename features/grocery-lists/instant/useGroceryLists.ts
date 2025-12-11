import { db } from '../../../lib/instant';

export const useGroceryLists = () => {
  const groceryListsQuery = db.useQuery({
    grocery_lists: {
      grocery_items: {},
    },
  });

  return groceryListsQuery;
};
