import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type RemoveItemFromMealPlanArgs = {
  mealPlanItemId: string;
};

export const removeItemFromMealPlan = async ({
  mealPlanItemId,
}: RemoveItemFromMealPlanArgs) => {
  await db.transact([tx.meal_plan_items[mealPlanItemId].delete()]);
};





