import { tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  buildRecipeIngredientEditTransactions,
  queryRecipeIngredientEditTargets,
} from '../../meal-planner/instant/propagate-recipe-ingredient-edit';

import { buildIngredientStoreLinkTransactions } from './link-store-to-ingredient';
import type { DefaultStoreForStacking } from './stack-recipe-ingredients-plan';

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
  /** List default store, applied to linked grocery items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

const writeRecipeIngredientUpdate = async ({
  ingredientId,
  updates,
  currentStoreId,
  defaultStore,
}: UpdateRecipeIngredientArgs) => {
  const { storeId, ...otherUpdates } = updates;
  const processedUpdates = trimStringFields({
    ...otherUpdates,
    category: otherUpdates.category ?? null,
    notes: otherUpdates.notes ?? null,
  });
  const isRelinkingStore = storeId !== undefined || !!currentStoreId;

  const recipeRows = await queryRecipeIngredientEditTargets({
    recipeIngredientId: ingredientId,
  });
  // The planned meals were loaded before the write, so their recipe still
  // holds the pre-edit ingredient.
  const previous = recipeRows
    .flatMap(row => row.recipe?.recipe_ingredients ?? [])
    .find(ingredient => ingredient.id === ingredientId);

  const transactions: TransactionChunk[] = [
    tx.recipe_ingredients[ingredientId].update(processedUpdates),
  ];
  if (isRelinkingStore) {
    transactions.push(
      ...buildIngredientStoreLinkTransactions({
        ingredientId,
        storeId,
        currentStoreId,
      })
    );
  }

  if (previous) {
    const nextStoreId = isRelinkingStore ? storeId : previous.store?.id;
    transactions.push(
      ...buildRecipeIngredientEditTransactions({
        recipeRows,
        edit: {
          type: 'update',
          ingredient: {
            ...previous,
            ...processedUpdates,
            store: nextStoreId ? { id: nextStoreId } : null,
          },
        },
        defaultStore,
      })
    );
  }

  await db.transact(transactions);

  return { ingredientId };
};

/** Last queued write per ingredient; see `updateRecipeIngredient`. */
const pendingWrites = new Map<string, Promise<unknown>>();

/**
 * Updates a recipe ingredient and, in the same transaction, the planned
 * meals using its recipe on lists the editor is a member of: snapshot fields
 * that still follow the recipe take the new values, and their unchecked
 * linked grocery items are re-projected.
 *
 * Each write loads the planned meals first, so writes to one ingredient are
 * queued: the live edit sheet fires them in quick succession with the full
 * field payload, and one landing out of order would undo a newer edit.
 */
export const updateRecipeIngredient = (
  args: UpdateRecipeIngredientArgs
): Promise<{ ingredientId: string }> => {
  const previousWrite = pendingWrites.get(args.ingredientId);
  const write = (previousWrite ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => writeRecipeIngredientUpdate(args));
  pendingWrites.set(args.ingredientId, write);
  void write
    .catch(() => undefined)
    .finally(() => {
      if (pendingWrites.get(args.ingredientId) === write) {
        pendingWrites.delete(args.ingredientId);
      }
    });

  return write;
};
