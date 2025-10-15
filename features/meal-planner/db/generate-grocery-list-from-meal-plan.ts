import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import {
  mealPlanRecipeTable,
  mealPlanTable,
  recipeIngredientTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GenerateGroceryListFromMealPlanArgs } from '../types';

export const generateGroceryListFromMealPlan = async ({
  mealPlanId,
}: GenerateGroceryListFromMealPlanArgs) => {
  // First check if the meal plan has a grocery list
  const mealPlan = await db
    .select({ groceryListId: mealPlanTable.groceryListId })
    .from(mealPlanTable)
    .where(eq(mealPlanTable.id, mealPlanId))
    .limit(1);

  if (!mealPlan[0]?.groceryListId) {
    throw new Error('Meal plan does not have a linked grocery list');
  }

  // Get all recipes in the meal plan with their ingredients
  const mealPlanRecipes = await db
    .select({
      recipeId: mealPlanRecipeTable.recipeId,
      servings: mealPlanRecipeTable.servings,
      ingredient: {
        name: recipeIngredientTable.name,
        quantity: recipeIngredientTable.quantity,
        unit: recipeIngredientTable.unit,
      },
    })
    .from(mealPlanRecipeTable)
    .innerJoin(
      recipeIngredientTable,
      eq(mealPlanRecipeTable.recipeId, recipeIngredientTable.recipeId)
    )
    .where(eq(mealPlanRecipeTable.mealPlanId, mealPlanId));

  // Group ingredients by name and unit, summing quantities
  const ingredientMap = new Map<string, { quantity: number; unit: string }>();

  for (const mealPlanRecipe of mealPlanRecipes) {
    const key = `${mealPlanRecipe.ingredient.name}-${mealPlanRecipe.ingredient.unit}`;
    const scaledQuantity =
      mealPlanRecipe.ingredient.quantity * mealPlanRecipe.servings;

    if (ingredientMap.has(key)) {
      const existing = ingredientMap.get(key)!;
      existing.quantity += scaledQuantity;
    } else {
      ingredientMap.set(key, {
        quantity: scaledQuantity,
        unit: mealPlanRecipe.ingredient.unit,
      });
    }
  }

  // Convert to grocery list items
  const groceryListItems = Array.from(ingredientMap.entries()).map(
    ([key, data]) => {
      const [name] = key.split('-');
      return {
        id: generateId(),
        name,
        quantity: data.quantity,
        unit: data.unit,
        isChecked: false,
      };
    }
  );

  return { ingredients: groceryListItems };
};
