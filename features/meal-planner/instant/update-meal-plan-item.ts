import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UpdateMealPlanItemArgs = {
  mealPlanItemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string;
    storeId?: string;
    date?: string;
    mealTag?: string;
  };
};

export const updateMealPlanItem = async ({
  mealPlanItemId,
  updates,
}: UpdateMealPlanItemArgs) => {
  const { storeId, ...otherUpdates } = updates;

  const transactions = [
    tx.meal_plan_items[mealPlanItemId].update(
      trimStringFields({
        ...otherUpdates,
        notes: otherUpdates.notes ?? null,
        category: otherUpdates.category ?? null,
        mealTag: otherUpdates.mealTag ?? null,
        updatedAt: new Date().toISOString(),
      })
    ),
  ];

  // If store is being changed, update the link
  if (storeId !== undefined) {
    if (storeId) {
      transactions.push(
        tx.meal_plan_items[mealPlanItemId].link({
          store: storeId,
        })
      );
    } else {
      // If storeId is explicitly set to undefined/empty, unlink the store
      transactions.push(
        tx.meal_plan_items[mealPlanItemId].unlink({
          store: storeId,
        })
      );
    }
  }

  await db.transact(transactions);
};



