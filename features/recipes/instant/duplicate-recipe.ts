import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export const duplicateRecipe = async (recipeId: string) => {
  // First, query the recipe and its ingredients
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

  const originalRecipe = result.data.recipes[0];

  if (!originalRecipe) {
    throw new Error('Recipe not found');
  }

  const newRecipeId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.recipes[newRecipeId].update({
      name: `${originalRecipe.name} (Copy)`,
      description: originalRecipe.description,
      imageSrc: originalRecipe.imageSrc,
      visibility: originalRecipe.visibility,
      createdAt: now,
      updatedAt: now,
    }),
  ];

  // Duplicate ingredients
  const ingredients = originalRecipe.recipe_ingredients || [];
  for (const ingredient of ingredients) {
    const newIngredientId = id();
    transactions.push(
      tx.recipe_ingredients[newIngredientId].update({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category,
        order: ingredient.order,
      }),
      tx.recipe_ingredients[newIngredientId].link({
        recipe: newRecipeId,
      })
    );
  }

  await db.transact(transactions);

  return { id: newRecipeId };
};
