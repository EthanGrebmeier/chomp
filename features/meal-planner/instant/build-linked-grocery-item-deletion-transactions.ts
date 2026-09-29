import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

import type { LinkedGroceryItemDeletionPlan } from './plan-linked-grocery-item-deletion';

/**
 * Turns a `planLinkedGroceryItemDeletion` plan into transaction chunks, so the
 * grocery item deletes and their meal plan write-back land in one
 * `db.transact`.
 */
export const buildLinkedGroceryItemDeletionTransactions = (
  plan: LinkedGroceryItemDeletionPlan,
  now: string = new Date().toISOString()
): TransactionChunk[] => [
  ...plan.groceryItemIdsToSoftDelete.map(itemId =>
    tx.grocery_items[itemId].update({
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    })
  ),
  ...plan.groceryItemIdsToRemove.map(itemId =>
    tx.grocery_items[itemId].delete()
  ),
  ...plan.snapshotRowIdsToDeselect.map(snapshotRowId =>
    tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update({
      isSelected: false,
    })
  ),
  ...plan.entriesToIgnore.map(entry =>
    (entry.type === 'recipe' ? tx.meal_plan_recipes : tx.meal_plan_items)[
      entry.id
    ].update({ ignoredByGroceryList: true, updatedAt: now })
  ),
];
