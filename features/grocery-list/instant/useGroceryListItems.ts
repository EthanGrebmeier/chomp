import { db } from '../../../lib/instant';

export const useGroceryListItems = (listId: string) => {
  return db.useQuery({
    grocery_items: {
      $: {
        where: {
          'grocery_lists.id': listId,
        },
      },
    },
  });
};
