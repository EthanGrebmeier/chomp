import { db } from '../../../lib/instant';

export const useGroceryListItems = (listId?: string) => {
  return db.useQuery(
    listId
      ? {
          grocery_items: {
            $: {
              where: {
                isDeleted: false,
                'grocery_list.id': listId,
              },
            },
          },
        }
      : null
  );
};
