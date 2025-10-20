import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  mealPlanTable,
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

    // Create a new grocery list
    await db.insert(groceryListTable).values({
      id: newListId,
      name: listName,
      date: new Date().toISOString(),
    });

    targetGroceryListId = newListId;
    isNewList = true;
  }

  // Generate the aggregated ingredients from the meal plan
  const { ingredients } = await generateIngredientsFromMealPlan({ mealPlanId });

  // Add all ingredients to the grocery list
  const groceryListItems = [];
  for (const ingredient of ingredients) {
    // Find or create the item
    const item = await findOrCreateItem({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });

    groceryListItems.push({
      id: generateId(),
      groceryListId: targetGroceryListId!,
      itemId: item.id,
      isChecked: false,
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
