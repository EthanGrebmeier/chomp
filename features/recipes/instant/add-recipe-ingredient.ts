import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  buildRecipeIngredientEditTransactions,
  queryRecipeIngredientEditTargets,
} from '../../meal-planner/instant/propagate-recipe-ingredient-edit';
import { addSavedItemIfNotExists } from '../../saved-items/instant/add-saved-item-if-not-exists';

import type { DefaultStoreForStacking } from './stack-recipe-ingredients-plan';

export type AddRecipeIngredientArgs = {
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string | null;
  storeId?: string;
  /** List default store, applied to linked grocery items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

/**
 * Adds an ingredient to a recipe and, in the same transaction, to each
 * planned meal using the recipe (on lists the editor is a member of) that
 * isn't ignored by the grocery list: a selected snapshot row and a linked
 * grocery item.
 */
export const addRecipeIngredient = async ({
  recipeId,
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  defaultStore,
}: AddRecipeIngredientArgs) => {
  const ingredientId = id();
  const fields = trimStringFields({
    name,
    quantity,
    unit,
    notes,
    category: category ?? undefined,
  });
  const recipeRows = await queryRecipeIngredientEditTargets({ recipeId });

  const transactions: TransactionChunk[] = [
    tx.recipe_ingredients[ingredientId].create(fields),
    tx.recipe_ingredients[ingredientId].link({
      recipe: recipeId,
    }),
  ];

  // Link store if provided
  if (storeId) {
    transactions.push(
      tx.recipe_ingredients[ingredientId].link({
        store: storeId,
      })
    );
  }

  transactions.push(
    ...buildRecipeIngredientEditTransactions({
      recipeRows,
      edit: {
        type: 'add',
        ingredient: {
          ...fields,
          id: ingredientId,
          store: storeId ? { id: storeId } : null,
        },
      },
      defaultStore,
    })
  );

  await db.transact(transactions);

  // Auto-save ingredient to user's saved items if it doesn't exist
  addSavedItemIfNotExists({
    name,
    category: category ?? undefined,
  });

  return { id: ingredientId };
};
