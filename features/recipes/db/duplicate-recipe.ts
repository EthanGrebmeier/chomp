import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { recipeIngredientTable, recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const duplicateRecipe = async (recipeId: string) => {
  // Get the original recipe
  const originalRecipe = await db
    .select()
    .from(recipeTable)
    .where(eq(recipeTable.id, recipeId))
    .limit(1);

  if (originalRecipe.length === 0) {
    throw new Error('Recipe not found');
  }

  // Get the original ingredients
  const originalIngredients = await db
    .select()
    .from(recipeIngredientTable)
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  const newRecipeId = generateId();
  const now = new Date().toISOString();

  // Create the duplicated recipe
  await db.insert(recipeTable).values({
    id: newRecipeId,
    name: `${originalRecipe[0].name} (Copy)`,
    description: originalRecipe[0].description,
    imageSrc: originalRecipe[0].imageSrc,
    createdAt: now,
    updatedAt: now,
  });

  // Create duplicated ingredients
  if (originalIngredients.length > 0) {
    const newIngredients = originalIngredients.map(ingredient => ({
      id: generateId(),
      recipeId: newRecipeId,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes,
      category: ingredient.category,
      order: ingredient.order,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(recipeIngredientTable).values(newIngredients);
  }

  return { id: newRecipeId };
};

