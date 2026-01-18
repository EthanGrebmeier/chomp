import { useMutation } from '@tanstack/react-query';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { GroceryListItem } from '../types';

type clearCheckedItemsArgs = {
  itemIds: string[];
};

const clearCheckedItems = async ({ itemIds }: clearCheckedItemsArgs) => {
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

export const filterCheckedItems = (groceryItems: GroceryListItem[]) => {
  return groceryItems.filter(item => item.isChecked).map(item => item.id);
};

export const useClearCheckedItems = () => {
  return useMutation({
    mutationFn: clearCheckedItems,
  });
};
