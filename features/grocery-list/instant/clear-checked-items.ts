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

type useClearCheckedItemsArgs = {
  groceryItems: GroceryListItem[];
};

export const useClearCheckedItems = ({
  groceryItems,
}: useClearCheckedItemsArgs) => {
  const checkedItemIds = groceryItems
    .filter(item => item.isChecked)
    .map(item => item.id);

  return useMutation({
    mutationFn: () => clearCheckedItems({ itemIds: checkedItemIds }),
  });
};
