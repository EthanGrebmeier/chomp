import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type ClearMealPlanArgs = {
  mealPlanRecipeIds: string[];
  mealPlanItemIds: string[];
};

export const clearMealPlan = async ({
  mealPlanRecipeIds,
  mealPlanItemIds,
}: ClearMealPlanArgs) => {
  if (mealPlanRecipeIds.length === 0 && mealPlanItemIds.length === 0) {
    return;
  }

  const deleteRecipes = mealPlanRecipeIds.map(mealPlanRecipeId =>
    tx.meal_plan_recipes[mealPlanRecipeId].delete()
  );
  const deleteItems = mealPlanItemIds.map(mealPlanItemId =>
    tx.meal_plan_items[mealPlanItemId].delete()
  );

  await db.transact([...deleteRecipes, ...deleteItems]);
};
