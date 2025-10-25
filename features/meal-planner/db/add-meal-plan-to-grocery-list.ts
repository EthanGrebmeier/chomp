import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  mealPlanTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
import { GenerateGroceryListFromMealPlanArgs } from '../types';
import { generateIngredientsFromMealPlan } from './generate-ingredients-from-meal-plan';

type AddMealPlanToGroceryListArgs = GenerateGroceryListFromMealPlanArgs & {
  groceryListId?: string;
  groceryListName?: string;
};

export const addMealPlanToGroceryList = async ({
  mealPlanId,
  groceryListId,
  groceryListName,
}: AddMealPlanToGroceryListArgs) => {
  // Get the meal plan
  const mealPlan = await db
    .select({
      name: mealPlanTable.name,
    })
    .from(mealPlanTable)
    .where(eq(mealPlanTable.id, mealPlanId))
    .limit(1);

  if (mealPlan.length === 0) {
    throw new Error('Meal plan not found');
  }

  let targetGroceryListId = groceryListId;
  let isNewList = false;

  // If no groceryListId provided, create a new grocery list
  if (!groceryListId) {
    const listName = groceryListName || `${mealPlan[0].name} - Grocery List`;
    const newListId = generateId();
    const now = new Date().toISOString();
    // Create a new grocery list
    await db.insert(groceryListTable).values({
      id: newListId,
      name: listName,
      createdAt: now,
      updatedAt: now,
      date: new Date().toISOString(),
    });

    targetGroceryListId = newListId;
    isNewList = true;
  }

  // Get all item IDs that are currently used by recipe ingredients
  const recipeIngredientItems = await db
    .select({ itemId: recipeIngredientTable.itemId })
    .from(recipeIngredientTable);

  const excludeItemIds = recipeIngredientItems.map(row => row.itemId);

  // Generate the aggregated ingredients from the meal plan
  const { ingredients } = await generateIngredientsFromMealPlan({ mealPlanId });

  // Add all ingredients to the grocery list
  const groceryListItems = [];
  const now = new Date().toISOString();
  for (const ingredient of ingredients) {
    // Find or create the item, excluding items used by recipe ingredients
    const item = await findOrCreateItem({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      excludeItemIds,
    });

    groceryListItems.push({
      id: generateId(),
      groceryListId: targetGroceryListId!,
      itemId: item.id,
      isChecked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert all items in a single transaction
  await db.insert(groceryListItemTable).values(groceryListItems);

  return {
    groceryListId: targetGroceryListId!,
    addedItems: groceryListItems.length,
    items: groceryListItems,
    isNewList,
  };
};
