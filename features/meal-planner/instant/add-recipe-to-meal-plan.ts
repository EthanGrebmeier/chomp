import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type AddRecipeToDateArgs = {
  recipeId: string;
  date: string;
  mealTag?: string;
  servings?: number;
};

export const addRecipeToDate = async ({
  recipeId,
  date,
  mealTag,
  servings = 1,
}: AddRecipeToDateArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const mealPlanRecipeId = id();
  const now = new Date().toISOString();

  await db.transact([
    tx.meal_plan_recipes[mealPlanRecipeId].update(
      trimStringFields({
        mealTag: mealTag,
        date: date,
        servings: servings,
        addedToList: false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.meal_plan_recipes[mealPlanRecipeId].link({
      user: user.id,
      recipe: recipeId,
    }),
  ]);

  return { id: mealPlanRecipeId };
};
