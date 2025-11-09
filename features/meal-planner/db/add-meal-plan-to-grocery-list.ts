import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  mealPlanRecipeTable,
  mealPlanTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GenerateGroceryListFromMealPlanArgs } from '../types';

export const addMealPlanToGroceryList = async ({
  mealPlanId,
}: GenerateGroceryListFromMealPlanArgs) => {
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

  // Get all recipes in the meal plan with their ingredients
  const mealPlanRecipes = await db
    .select({
      recipeId: mealPlanRecipeTable.recipeId,
      servings: mealPlanRecipeTable.servings,
      ingredient: recipeIngredientTable,
    })
    .from(mealPlanRecipeTable)
    .innerJoin(
      recipeIngredientTable,
      eq(mealPlanRecipeTable.recipeId, recipeIngredientTable.recipeId)
    )
    .where(eq(mealPlanRecipeTable.mealPlanId, mealPlanId));

  // Add each recipe's ingredients to the grocery list
  const groceryListItems = [];
  const now = new Date().toISOString();

  for (const mealPlanRecipe of mealPlanRecipes) {
    const adjustedQuantity =
      mealPlanRecipe.ingredient.quantity * mealPlanRecipe.servings;

    groceryListItems.push({
      id: generateId(),
      name: mealPlanRecipe.ingredient.name,
      quantity: adjustedQuantity,
      unit: mealPlanRecipe.ingredient.unit,
      notes: mealPlanRecipe.ingredient.notes ?? undefined,
      category: mealPlanRecipe.ingredient.category ?? undefined,
      recipeId: mealPlanRecipe.recipeId, // Preserve recipe context
      isChecked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (groceryListItems.length > 0) {
    // Insert all items in a single transaction
    await db.insert(groceryListItemTable).values(groceryListItems);
  }

  return {
    addedItems: groceryListItems.length,
    items: groceryListItems,
  };
};
