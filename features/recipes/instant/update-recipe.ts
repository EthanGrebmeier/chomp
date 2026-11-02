import { tx } from '@instantdb/react-native';

import { transactLocally } from '@/lib/instant/local-transaction';

import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
    mealTag?: string;
    sourceUrl?: string;
  };
};

export const updateRecipe = async ({ recipeId, updates }: UpdateRecipeArgs) => {
  await transactLocally([
    tx.recipes[recipeId].update(
      trimStringFields({
        ...updates,
        mealTag: updates.mealTag ?? null,
        sourceUrl: updates.sourceUrl ?? null,
        updatedAt: new Date().toISOString(),
      })
    ),
  ]);
};
