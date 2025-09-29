import { generateId } from '@/lib/utils';
import { recipeIngredientTable, recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { CreateRecipeArgs } from '../types';

export const createRecipe = async ({
  recipe,
  ingredients,
}: CreateRecipeArgs) => {
  const recipeId = generateId();
  const now = new Date().toISOString();

  // Create the recipe
  await db.insert(recipeTable).values({
    id: recipeId,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    createdAt: now,
  });

  // Create the ingredients
  if (ingredients.length > 0) {
    const ingredientsWithIds = ingredients.map((ingredient, index) => ({
      id: generateId(),
      recipeId,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes,
      order: ingredient.order ?? index,
    }));

    await db.insert(recipeIngredientTable).values(ingredientsWithIds);
  }

  return { id: recipeId };
};
