import { updateQuantityChecked } from '@/features/quantity/app/checked-state';

import type {
  LinkedGroceryItemPatch,
  MealPlanWriteBackSource,
} from '../../meal-planner/instant/plan-list-to-meal-plan-write-back';
import { GroceryListItem } from '../types';

export type UpdateGroceryItemOnlyArgs = {
  itemId: string;
  item: Partial<GroceryListItem> & { storeId?: string };
  currentStoreId?: string;
  currentSavedItemId?: string;
  selectedSavedItemId?: string;
  selectedLocalSavedItemId?: string;
  /**
   * For items linked to the meal plan: the source to write the edit back to,
   * and the fields that changed. Written in the same transaction.
   */
  mealPlanWriteBack?: {
    source: MealPlanWriteBackSource;
    patch: LinkedGroceryItemPatch;
  };
};

export type CheckedStateUpdate = {
  itemId: string;
  isChecked: boolean;
};

/** Updates contribution-row metadata through the durable quantity session. */
export const updateGroceryItemOnly = async ({
  itemId,
  item,
}: UpdateGroceryItemOnlyArgs) => {
  const { updateQuantityRow } =
    await import('@/features/quantity/app/grocery-actions');
  return updateQuantityRow(itemId, item);
};

export const updateGroceryItemsCheckedState = async (
  updates: CheckedStateUpdate[]
) => {
  return updateQuantityChecked(updates);
};
