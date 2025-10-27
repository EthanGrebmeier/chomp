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
    createdAt: now,
    updatedAt: now,
  });

  // Create the ingredients
  if (ingredients.length > 0) {
    const ingredientsWithIds = [];
    for (const [index, ingredient] of ingredients.entries()) {
      ingredientsWithIds.push({
        id: generateId(),
        recipeId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category ?? null,
        order: ingredient.order ?? index,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.insert(recipeIngredientTable).values(ingredientsWithIds);
  }

  return { id: recipeId };
};
