import { db } from '../../../lib/instant';
import { GroceryListItemWithRecipe } from '../types';

const EMPTY_ITEMS: GroceryListItemWithRecipe[] = [];

/**
 * Live items for a single grocery list.
 *
 * Scoped to one list so a collaborator's write on another list does not
 * re-emit this subscription. The linked relations are the ones the item row,
 * edit sheet, and bulk actions read (`recipe`, `store`, `saved_item` + its
 * `store`/`user`).
 *
 * Passing `undefined` skips the query.
 */
export const useGroceryListItems = (listId: string | undefined) => {
  const query = db.useQuery(
    listId
      ? {
          grocery_items: {
            $: {
              where: {
                'grocery_list.id': listId,
                isDeleted: false,
              },
              order: { createdAt: 'desc' },
            },
            recipe: {},
            store: {},
            saved_item: {
              store: {},
              user: {},
            },
          },
        }
      : null
  );

  return {
    items: query.data?.grocery_items ?? EMPTY_ITEMS,
    isLoading: listId ? query.isLoading : false,
    error: query.error,
  };
};
