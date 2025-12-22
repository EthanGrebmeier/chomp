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

  // Get the next order number for this date
  const existingRecipes = await db.queryOnce({
    meal_plan_recipes: {
      $: {
        where: {
          'meal_plan.id': mealPlanId,
          date: date,
        },
      },
    },
  });

  const recipes = existingRecipes.data.meal_plan_recipes || [];
  const nextOrder =
    recipes.length > 0 ? Math.max(...recipes.map(r => r.order)) + 1 : 0;

  await db.transact([
    tx.meal_plan_recipes[mealPlanRecipeId].update({
      mealTag: mealTag,
      date: date,
      servings: servings,
      order: nextOrder,
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
