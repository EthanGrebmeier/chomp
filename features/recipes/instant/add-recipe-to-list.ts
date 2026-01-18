import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type RecipeIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
};

export type AddRecipeToListArgs = {
  recipeId: string;
  listId: string;
  // Pass ingredients directly to avoid queryOnce which doesn't work offline
  ingredients: RecipeIngredientInput[];
};

export const addRecipeToList = async ({
  recipeId,
  listId,
  ingredients,
}: AddRecipeToListArgs) => {
  const now = new Date().toISOString();
  const transactions = [];

  // Convert recipe ingredients to grocery list items
  for (const ingredient of ingredients) {
    const itemId = id();
    transactions.push(
      tx.grocery_items[itemId].update(
        trimStringFields({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          category: ingredient.category,
          isChecked: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        })
      ),
      tx.grocery_items[itemId].link({
        grocery_list: listId,
        recipe: recipeId,
      })
    );

    // Link store if provided
    if (ingredient.storeId) {
      transactions.push(
        tx.grocery_items[itemId].link({
          store: ingredient.storeId,
        })
      );
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return { addedItems: ingredients.length };
};
