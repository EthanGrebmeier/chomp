import { db } from '../../../lib/instant';
import { buildLinkedGroceryItemDeletionTransactions } from '../../meal-planner/instant/build-linked-grocery-item-deletion-transactions';
import {
  type GroceryItemForDeletion,
  planLinkedGroceryItemDeletion,
} from '../../meal-planner/instant/plan-linked-grocery-item-deletion';

/**
 * Deletes grocery items the user removed from the list (swipe, bulk delete,
 * Clear List) and, in the same transaction, writes the delete back to the
 * meal plan (see `planLinkedGroceryItemDeletion`): a linked recipe ingredient
 * is deselected, and an entry with nothing left becomes "meal plan only".
 *
 * Takes the items as loaded by `useGroceryListItems`, which includes each
 * source entry's snapshot selection, so deletes stay instant and work offline.
 *
 * Not for clearing checked items, which leaves the meal plan alone.
 */
export const deleteGroceryItems = async ({
  items,
}: {
  items: GroceryItemForDeletion[];
}) => {
  const transactions = buildLinkedGroceryItemDeletionTransactions(
    planLinkedGroceryItemDeletion(items)
  );

  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};
