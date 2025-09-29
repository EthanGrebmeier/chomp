import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { AddRecipeToListArgs } from '../types';

export const addRecipeToList = async ({
  recipeId,
  groceryListId,
}: AddRecipeToListArgs) => {
  // Get all ingredients for the recipe
  const ingredients = await db
    .select()
    .from(recipeIngredientTable)
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  // Convert recipe ingredients to grocery list items
  const groceryListItems = ingredients.map(ingredient => ({
    id: generateId(),
    groceryListId,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    isChecked: false,
  }));

  // Insert all items into the grocery list
  if (groceryListItems.length > 0) {
    await db.insert(groceryListItemTable).values(groceryListItems);
  }

  return { addedItems: groceryListItems.length };
};
