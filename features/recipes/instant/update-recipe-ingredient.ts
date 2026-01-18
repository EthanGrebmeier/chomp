import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { linkStoreToIngredient } from './link-store-to-ingredient';

export type UpdateRecipeIngredientArgs = {
  ingredientId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string | null;
    order?: number;
    storeId?: string;
  };
  currentStoreId?: string;
};

export const updateRecipeIngredient = async ({
  ingredientId,
  updates,
  currentStoreId,
}: UpdateRecipeIngredientArgs) => {
  const { storeId, ...otherUpdates } = updates;
  const processedUpdates = trimStringFields({
    ...otherUpdates,
    category: otherUpdates.category ?? null,
    notes: otherUpdates.notes ?? null,
  });

  const transactions = [tx.recipe_ingredients[ingredientId].update(processedUpdates)];

  // Handle store linking/unlinking separately
  if (storeId !== undefined || currentStoreId) {
    await db.transact(transactions);
    await linkStoreToIngredient({
      ingredientId,
      storeId,
      currentStoreId,
    });
  } else {
    await db.transact(transactions);
  }

  return { ingredientId };
};
