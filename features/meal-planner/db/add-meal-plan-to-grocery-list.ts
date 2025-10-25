import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  itemTable,
  mealPlanRecipeTable,
  mealPlanTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
import { GenerateGroceryListFromMealPlanArgs } from '../types';

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

  // Get all recipes in the meal plan with their ingredients
  const mealPlanRecipes = await db
    .select({
      recipeId: mealPlanRecipeTable.recipeId,
      servings: mealPlanRecipeTable.servings,
      ingredient: {
        id: itemTable.id,
        name: itemTable.name,
        quantity: itemTable.quantity,
        unit: itemTable.unit,
      },
    })
    .from(mealPlanRecipeTable)
    .innerJoin(
      recipeIngredientTable,
      eq(mealPlanRecipeTable.recipeId, recipeIngredientTable.recipeId)
    )
    .innerJoin(itemTable, eq(recipeIngredientTable.itemId, itemTable.id))
    .where(eq(mealPlanRecipeTable.mealPlanId, mealPlanId));

  // Get all item IDs that are currently used by recipe ingredients
  const recipeIngredientItems = await db
    .select({ itemId: recipeIngredientTable.itemId })
    .from(recipeIngredientTable);

  const excludeItemIds = recipeIngredientItems.map(row => row.itemId);

  // Add each recipe's ingredients to the grocery list individually
  const groceryListItems = [];
  const now = new Date().toISOString();

  for (const mealPlanRecipe of mealPlanRecipes) {
    // Find or create the item, excluding items used by recipe ingredients
    const item = await findOrCreateItem({
      name: mealPlanRecipe.ingredient.name,
      quantity: mealPlanRecipe.ingredient.quantity * mealPlanRecipe.servings,
      unit: mealPlanRecipe.ingredient.unit,
      excludeItemIds,
    });

    groceryListItems.push({
      id: generateId(),
      groceryListId: targetGroceryListId!,
      itemId: item.id,
      recipeId: mealPlanRecipe.recipeId, // Preserve recipe context
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
