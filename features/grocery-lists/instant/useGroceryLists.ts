import { db } from '../../../lib/instant';

export const useGroceryLists = () => {
  const groceryListsQuery = db.useQuery({
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
  });

  return groceryListsQuery;
};
