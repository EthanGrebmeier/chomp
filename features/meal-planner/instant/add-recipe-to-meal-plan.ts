import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddRecipeToMealPlanArgs = {
  mealPlanId: string;
  recipeId: string;
  date: string;
  mealTag?: string;
  servings?: number;
};

export const addRecipeToMealPlan = async ({
  mealPlanId,
  recipeId,
  date,
  mealTag,
  servings = 1,
}: AddRecipeToMealPlanArgs) => {
  const mealPlanRecipeId = id();
  const now = new Date().toISOString();

  await db.transact([
    tx.meal_plan_recipes[mealPlanRecipeId].update({
      mealTag: mealTag,
      date: date,
      servings: servings,
      createdAt: now,
      updatedAt: now,
    }),
    tx.meal_plan_recipes[mealPlanRecipeId].link({
      meal_plan: mealPlanId,
      recipe: recipeId,
    }),
  ]);

  return { id: mealPlanRecipeId };
};
