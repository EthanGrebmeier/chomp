import { generateId } from '@/lib/utils';
import { recipeIngredientTable, recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
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
  });

  // Create the ingredients
  if (ingredients.length > 0) {
    const ingredientsWithIds = [];
    for (const [index, ingredient] of ingredients.entries()) {
      // Find or create the item
      const item = await findOrCreateItem({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
      });

      ingredientsWithIds.push({
        id: generateId(),
        recipeId,
        itemId: item.id,
        notes: ingredient.notes,
        order: ingredient.order ?? index,
      });
    }

    await db.insert(recipeIngredientTable).values(ingredientsWithIds);
  }

  return { id: recipeId };
};
