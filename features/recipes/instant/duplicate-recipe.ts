import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

import { RecipeIngredientInput } from './add-recipe-to-list';

export type DuplicateRecipeArgs = {
  name: string;
  description?: string;
  imageSrc?: string;
  visibility?: string;
  ingredients: RecipeIngredientInput[];
};

export const duplicateRecipe = async (recipe: DuplicateRecipeArgs) => {
  const newRecipeId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.recipes[newRecipeId].update({
      name: `${recipe.name} (Copy)`,
      description: recipe.description,
      imageSrc: recipe.imageSrc,
      visibility: recipe.visibility,
      createdAt: now,
      updatedAt: now,
    }),
  ];

  // Duplicate ingredients
  for (const ingredient of recipe.ingredients) {
    const newIngredientId = id();
    transactions.push(
      tx.recipe_ingredients[newIngredientId].update({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category,
      }),
      tx.recipe_ingredients[newIngredientId].link({
        recipe: newRecipeId,
      })
    );
  }

  await db.transact(transactions);

  return { id: newRecipeId };
};
