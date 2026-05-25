import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type UpdateMealPlanItemDateArgs = {
  mealPlanItemId: string;
  date: string;
};

export const updateMealPlanItemDate = async ({
  mealPlanItemId,
  date,
}: UpdateMealPlanItemDateArgs) => {
  await db.transact(
    tx.meal_plan_items[mealPlanItemId].update({
      date,
      updatedAt: new Date().toISOString(),
    })
  );
};