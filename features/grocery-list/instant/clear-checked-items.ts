import { useMutation } from '@tanstack/react-query';

import { db } from '../../../lib/instant';
import { GroceryListItem } from '../types';

type clearCheckedItemsArgs = {
  itemIds: string[];
};

const clearCheckedItems = async ({ itemIds }: clearCheckedItemsArgs) => {
  return db.transact(
    itemIds.map(itemId =>
      db.tx.grocery_items[itemId].update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      })
    )
  );
};

export const filterCheckedItems = (groceryItems: GroceryListItem[]) => {
  return groceryItems.filter(item => item.isChecked).map(item => item.id);
};

export const useClearCheckedItems = () => {
  return useMutation({
    mutationFn: clearCheckedItems,
  });
};
