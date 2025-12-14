import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { MealTag } from '../types';

export type UpdateMealPlanRecipeArgs = {
  mealPlanRecipeId: string;
  updates: {
    mealTag?: MealTag;
    servings?: number;
    order?: number;
    recipeId?: string;
    date?: string;
  };
};

export const updateMealPlanRecipe = async ({
  mealPlanRecipeId,
  updates,
}: UpdateMealPlanRecipeArgs) => {
  const { recipeId, ...otherUpdates } = updates;

  const transactions = [
    tx.meal_plan_recipes[mealPlanRecipeId].update({
      ...otherUpdates,
      updatedAt: new Date().toISOString(),
    }),
  ];

  // If recipe is being changed, update the link
  if (recipeId) {
    transactions.push(
      tx.meal_plan_recipes[mealPlanRecipeId].link({
        recipe: recipeId,
      })
    );
  }

  await db.transact(transactions);
};
