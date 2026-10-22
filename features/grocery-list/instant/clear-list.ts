import { useMutation } from '@tanstack/react-query';

import type { GroceryItemForDeletion } from '../../meal-planner/instant/plan-linked-grocery-item-deletion';
import { GroceryListItem } from '../types';

import { deleteGroceryItems } from './delete-grocery-items';

type clearGroceryListArgs = {
  items: GroceryItemForDeletion[];
};

/**
 * Deletes the given items (Clear List and bulk delete). Unchecked linked
 * items count as deletes and deselect their meal plan source; checked items
 * leave the meal plan alone. See `deleteGroceryItems`.
 */
const clearGroceryList = async ({ items }: clearGroceryListArgs) =>
  deleteGroceryItems({ items });

export const filterActiveItems = <Item extends GroceryListItem>(
  groceryItems: Item[]
) => groceryItems.filter(item => !item.isDeleted);

export const useClearGroceryList = () => {
  return useMutation({
    mutationFn: clearGroceryList,
  });
};
