import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type IncrementRecipeQuantitiesArgs = {
  recipeId: string;
  listId: string;
};

export const incrementRecipeQuantities = async ({
  recipeId,
  listId,
}: IncrementRecipeQuantitiesArgs) => {
  // Query all grocery items with their links and filter client-side
  // This ensures offline-created items are found (where clauses don't work for unsynced data)
  const result = await db.queryOnce({
    grocery_items: {
      recipe: {},
      grocery_list: {},
    },
  });

  const existingItems = (result.data.grocery_items || []).filter(
    item =>
      item.recipe?.id === recipeId &&
      item.grocery_list?.id === listId &&
      !item.isDeleted
  );

  // Double the quantity for each item
  const transactions = existingItems.map(item =>
    tx.grocery_items[item.id].update({
      quantity: item.quantity * 2,
      updatedAt: new Date().toISOString(),
    })
  );

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return { updatedItems: existingItems.length };
};
