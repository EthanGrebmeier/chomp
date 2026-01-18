import { useMutation } from '@tanstack/react-query';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { GroceryListItem } from '../types';

type clearGroceryListArgs = {
  itemIds: string[];
};

const clearGroceryList = async ({ itemIds }: clearGroceryListArgs) => {
  return db.transact(
    itemIds.map(itemId =>
      db.tx.grocery_items[itemId].update(
        trimStringFields({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        })
      )
    )
  );
};

export const filterActiveItems = (groceryItems: GroceryListItem[]) => {
  return groceryItems.filter(item => !item.isDeleted).map(item => item.id);
};

export const useClearGroceryList = () => {
  return useMutation({
    mutationFn: clearGroceryList,
  });
};
