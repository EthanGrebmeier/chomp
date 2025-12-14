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
  // Get all existing grocery list items for this recipe
  const result = await db.queryOnce({
    grocery_items: {
      $: {
        where: {
          'recipe.id': recipeId,
          'grocery_list.id': listId,
          isDeleted: false,
        },
      },
    },
  });

  const existingItems = result.data.grocery_items || [];

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
