import { tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

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
}: UpdateRecipeIngredientArgs) => {
  const { storeId, ...otherUpdates } = updates;
  const processedUpdates = trimStringFields({
    ...otherUpdates,
    category: otherUpdates.category ?? null,
    notes: otherUpdates.notes ?? null,
  });
  const isRelinkingStore = storeId !== undefined || !!currentStoreId;

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

  await db.transact(transactions);

  return { ingredientId };
};

/** Last queued write per ingredient; see `updateRecipeIngredient`. */
const pendingWrites = new Map<string, Promise<unknown>>();

/** Serialize catalog writes per ingredient; quantity sessions reconcile recipe changes. */
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
