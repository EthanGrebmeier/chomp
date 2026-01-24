import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type CreateRecipeArgs = {
  recipe: {
    name: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
    mealTag?: string;
    sourceUrl?: string;
    servings?: string;
  };
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    category?: string | null;
  }[];
};

export const createRecipe = async ({
  recipe,
  ingredients,
}: CreateRecipeArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const recipeId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.recipes[recipeId].update(
      trimStringFields({
        name: recipe.name,
        description: recipe.description ?? '',
        imageSrc: recipe.imageSrc ?? '',
        visibility: recipe.visibility ?? 'private',
        createdAt: now,
        updatedAt: now,
        mealTag: recipe.mealTag ?? undefined,
        sourceUrl: recipe.sourceUrl ?? undefined,
        servings: recipe.servings ?? undefined,
      })
    ),
    tx.recipes[recipeId].link({
      user: user.id,
    }),
  ];

  // Create ingredients and link them to the recipe
  for (const ingredient of ingredients) {
    const ingredientId = id();
    transactions.push(
      tx.recipe_ingredients[ingredientId].update(
        trimStringFields({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          category: ingredient.category ?? undefined,
        })
      ),
      tx.recipe_ingredients[ingredientId].link({
        recipe: recipeId,
      })
    );
  }

  await db.transact(transactions);

  return { id: recipeId };
};
