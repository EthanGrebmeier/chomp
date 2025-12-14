import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type RemoveRecipeFromMealPlanArgs = {
  mealPlanRecipeId: string;
};

export const removeRecipeFromMealPlan = async ({
  mealPlanRecipeId,
}: RemoveRecipeFromMealPlanArgs) => {
  await db.transact([tx.meal_plan_recipes[mealPlanRecipeId].delete()]);
};
