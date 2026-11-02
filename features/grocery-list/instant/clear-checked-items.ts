import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';

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
  const { deleteQuantityRows } =
    await import('@/features/quantity/app/grocery-actions');
  return deleteQuantityRows(itemIds);
};

export const filterCheckedItems = (groceryItems: GroceryListItem[]) => {
  return groceryItems.filter(item => item.isChecked).map(item => item.id);
};

export const useClearCheckedItems = () => {
  return useMutation({
    networkMode: 'always',
    onSuccess: () => toast.success('Checked items cleared'),
    onError: () => toast.error('Could not clear checked items'),
    mutationFn: clearCheckedItems,
  });
};
