import type { StoreReviewer } from '@/features/quantity/app/store-review';

import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

export type AddItemToDateArgs = {
  reviewConflicts?: StoreReviewer;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date: string;
  mealTag?: string;
  showOnGroceryList?: boolean;
  /** List default store, applied to the linked item when it has no store. */
  defaultStore?: DefaultStoreForStacking | null;
};

/**
 * Adds a standalone item to the meal plan and, in the same transaction,
 * optionally creates its linked grocery item (shown by default).
 */
export const addItemToDate = async ({
  listId,
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  date,
  mealTag,
  showOnGroceryList,
  defaultStore,
  reviewConflicts,
}: AddItemToDateArgs) => {
  const { planQuantityItem } =
    await import('@/features/quantity/app/meal-actions');
  return planQuantityItem({
    listId,
    name,
    quantity,
    unit,
    notes,
    category,
    storeId,
    date,
    mealTag,
    showOnGroceryList,
    defaultStore,
    reviewConflicts,
  });
};
