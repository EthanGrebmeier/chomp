import type { GroceryItemForDeletion } from '../../meal-planner/instant/plan-linked-grocery-item-deletion';

import { deleteGroceryItems } from './delete-grocery-items';

/**
 * Deletes one grocery item (swipe to delete). A linked item's delete is
 * written back to the meal plan; see `deleteGroceryItems`.
 */
export const removeGroceryListItem = async ({
  item,
}: {
  item: GroceryItemForDeletion;
}) => deleteGroceryItems({ items: [item] });
