import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
    mealTag?: string;
  };
};

export const updateRecipe = async ({ recipeId, updates }: UpdateRecipeArgs) => {
  await db.transact([
    tx.recipes[recipeId].update(
      trimStringFields({
        ...updates,
        mealTag: updates.mealTag ?? null,
        updatedAt: new Date().toISOString(),
      })
    ),
  ]);
};
