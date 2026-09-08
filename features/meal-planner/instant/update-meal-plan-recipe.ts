import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UpdateMealPlanRecipeArgs = {
  mealPlanRecipeId: string;
  updates: {
    mealTag?: string;
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
  const mealTagUpdate =
    otherUpdates.mealTag !== undefined
      ? { mealTag: otherUpdates.mealTag || null }
      : {};

  const transactions = [
    tx.meal_plan_recipes[mealPlanRecipeId].update(
      trimStringFields({
        ...otherUpdates,
        ...mealTagUpdate,
        updatedAt: new Date().toISOString(),
      })
    ),
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
