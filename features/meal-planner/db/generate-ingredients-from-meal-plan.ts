import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { mealPlanRecipeTable, recipeIngredientTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../../shared/types';
import { GenerateGroceryListFromMealPlanArgs } from '../types';

type GenerateIngredientsOptions = {
  includeIds?: boolean;
  includeChecked?: boolean;
};

export const generateIngredientsFromMealPlan = async (
  { mealPlanId }: GenerateGroceryListFromMealPlanArgs,
  options: GenerateIngredientsOptions = {}
) => {
  const { includeIds = false, includeChecked = false } = options;

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

  // Group ingredients by name and unit, summing quantities
  const ingredientMap = new Map<
    string,
    { quantity: number; unit: QuantityUnit }
  >();

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
  const ingredients = Array.from(ingredientMap.entries()).map(([key, data]) => {
    const [name] = key.split('-');
    const baseItem = {
      name,
      quantity: data.quantity,
      unit: data.unit,
    };

    if (includeIds) {
      return {
        ...baseItem,
        id: generateId(),
        ...(includeChecked && { isChecked: false }),
      };
    }

    return baseItem;
  });

  return { ingredients };
};
