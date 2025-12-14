import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type CreateRecipeArgs = {
  recipe: {
    name: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
  };
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    category?: string | null;
    order?: number;
  }[];
};

export const createRecipe = async ({
  recipe,
  ingredients,
}: CreateRecipeArgs) => {
  const recipeId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.recipes[recipeId].update({
      name: recipe.name,
      description: recipe.description ?? '',
      imageSrc: recipe.imageSrc ?? '',
      visibility: recipe.visibility ?? 'private',
      createdAt: now,
      updatedAt: now,
    }),
  ];

  // Create ingredients and link them to the recipe
  for (const [index, ingredient] of ingredients.entries()) {
    const ingredientId = id();
    transactions.push(
      tx.recipe_ingredients[ingredientId].update({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category ?? undefined,
        order: ingredient.order ?? index,
      }),
      tx.recipe_ingredients[ingredientId].link({
        recipe: recipeId,
      })
    );
  }

  await db.transact(transactions);

  return { id: recipeId };
};
