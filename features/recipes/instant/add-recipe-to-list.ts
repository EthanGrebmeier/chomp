import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddRecipeToListArgs = {
  recipeId: string;
  listId: string;
};

export const addRecipeToList = async ({
  recipeId,
  listId,
}: AddRecipeToListArgs) => {
  // Query the recipe ingredients
  const result = await db.queryOnce({
    recipes: {
      $: {
        where: {
          id: recipeId,
        },
      },
      recipe_ingredients: {},
    },
  });

  const recipe = result.data.recipes[0];

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  const ingredients = recipe.recipe_ingredients || [];
  const now = new Date().toISOString();

  const transactions = [];

  // Convert recipe ingredients to grocery list items
  for (const ingredient of ingredients) {
    const itemId = id();
    transactions.push(
      tx.grocery_items[itemId].update({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category,
        isChecked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      }),
      tx.grocery_items[itemId].link({
        grocery_list: listId,
        recipe: recipeId,
      })
    );
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return { addedItems: ingredients.length };
};
