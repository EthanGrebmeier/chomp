import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

export type IngredientStoreLinkArgs = {
  ingredientId: string;
  storeId?: string;
  currentStoreId?: string;
};

/**
 * Builds the writes that move a recipe ingredient's store link from
 * `currentStoreId` to `storeId` (unlinking when `storeId` is undefined).
 */
export const buildIngredientStoreLinkTransactions = ({
  ingredientId,
  storeId,
  currentStoreId,
}: IngredientStoreLinkArgs): TransactionChunk[] => {
  if (storeId === currentStoreId) {
    return [];
  }

  const transactions: TransactionChunk[] = [];
  if (currentStoreId) {
    transactions.push(
      tx.recipe_ingredients[ingredientId].unlink({ store: currentStoreId })
    );
  }
  if (storeId) {
    transactions.push(
      tx.recipe_ingredients[ingredientId].link({ store: storeId })
    );
  }
  return transactions;
};
