import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  itemTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
import { AddRecipeToListArgs } from '../types';

export const addRecipeToList = async ({
  recipeId,
  groceryListId,
}: AddRecipeToListArgs) => {
  // Get all ingredients for the recipe with their items
  const ingredients = await db
    .select({
      ingredient: recipeIngredientTable,
      item: itemTable,
    })
    .from(recipeIngredientTable)
    .leftJoin(itemTable, eq(recipeIngredientTable.itemId, itemTable.id))
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  // Convert recipe ingredients to grocery list items
  const groceryListItems = [];
  for (const { ingredient, item } of ingredients) {
    if (!item) {
      throw new Error(`Item not found for ingredient ${ingredient.id}`);
    }

    // Find or create the item (in case it needs to be duplicated for the grocery list)
    const groceryItem = await findOrCreateItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes ?? undefined,
    });

    groceryListItems.push({
      id: generateId(),
      groceryListId,
      itemId: groceryItem.id,
      recipeId: recipeId,
      isChecked: false,
    });
  }

  // Insert all items into the grocery list
  if (groceryListItems.length > 0) {
    await db.insert(groceryListItemTable).values(groceryListItems);
  }

  return { addedItems: groceryListItems.length };
};
