import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
  };
};

export const updateRecipe = async ({ recipeId, updates }: UpdateRecipeArgs) => {
  await db.transact([
    tx.recipes[recipeId].update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  ]);
};
