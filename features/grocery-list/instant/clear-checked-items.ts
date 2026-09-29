import { useMutation } from '@tanstack/react-query';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { GroceryListItem } from '../types';

type clearCheckedItemsArgs = {
  itemIds: string[];
};

/**
 * Soft-deletes checked items. This deliberately leaves the meal plan alone:
 * the items were bought, not skipped, and a soft-deleted linked item still
 * counts as present so it is never re-created. Use `deleteGroceryItems` for
 * deletes that should write back to the meal plan.
 */
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
