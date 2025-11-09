import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export type AddRecipeAsSeparateItemsArgs = {
  recipeId: string;
};

export const addRecipeAsSeparateItems = async ({
  recipeId,
}: AddRecipeAsSeparateItemsArgs) => {
  // Get all ingredients for the recipe
  const ingredients = await db
    .select()
    .from(recipeIngredientTable)
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  // Convert recipe ingredients to grocery list items (without recipeId)
  const groceryListItems = [];
  const now = new Date().toISOString();
  for (const ingredient of ingredients) {
    groceryListItems.push({
      id: generateId(),
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes ?? undefined,
      category: ingredient.category ?? undefined,
      recipeId: null, // No recipeId linking for separate items
      isChecked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert all items into the grocery list
  if (groceryListItems.length > 0) {
    await db.insert(groceryListItemTable).values(groceryListItems);
  }

  return { addedItems: groceryListItems.length };
};
