import { generateId } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';
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
  // Check if this recipe already exists in the grocery list
  const existingRecipeItems = await db
    .select()
    .from(groceryListItemTable)
    .where(
      and(
        eq(groceryListItemTable.groceryListId, groceryListId),
        eq(groceryListItemTable.recipeId, recipeId)
      )
    );

  if (existingRecipeItems.length > 0) {
    return { isDuplicate: true, existingItems: existingRecipeItems };
  }

  // Get all item IDs that are currently used by recipe ingredients
  const recipeIngredientItems = await db
    .select({ itemId: recipeIngredientTable.itemId })
    .from(recipeIngredientTable);

  const excludeItemIds = recipeIngredientItems.map(row => row.itemId);

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
  const now = new Date().toISOString();
  for (const { ingredient, item } of ingredients) {
    if (!item) {
      throw new Error(`Item not found for ingredient ${ingredient.id}`);
    }

    // Find or create the item (in case it needs to be duplicated for the grocery list)
    // Exclude items that are currently used by recipe ingredients to prevent bi-directional updates
    const groceryItem = await findOrCreateItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes ?? undefined,
      excludeItemIds,
    });

    groceryListItems.push({
      id: generateId(),
      groceryListId,
      itemId: groceryItem.id,
      recipeId: recipeId,
      isChecked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert all items into the grocery list
  if (groceryListItems.length > 0) {
    await db.insert(groceryListItemTable).values(groceryListItems);
  }

  return { addedItems: groceryListItems.length, isDuplicate: false };
};
