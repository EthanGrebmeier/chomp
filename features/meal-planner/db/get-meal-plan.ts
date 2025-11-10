import { eq } from 'drizzle-orm';

import {
  mealPlanRecipeTable,
  mealPlanTable,
  recipeTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { MealPlanWithRecipes } from '../types';

export const getMealPlan = async (
  mealPlanId: string
): Promise<MealPlanWithRecipes | null> => {
  // Get the meal plan
  const mealPlan = await db
    .select()
    .from(mealPlanTable)
    .where(eq(mealPlanTable.id, mealPlanId))
    .limit(1);

  if (mealPlan.length === 0) {
    return null;
  }

  // Get all recipes for this meal plan
  const recipes = await db
    .select({
      id: mealPlanRecipeTable.id,
      mealPlanId: mealPlanRecipeTable.mealPlanId,
      recipeId: mealPlanRecipeTable.recipeId,
      mealTag: mealPlanRecipeTable.mealTag,
      date: mealPlanRecipeTable.date,
      servings: mealPlanRecipeTable.servings,
      order: mealPlanRecipeTable.order,
      createdAt: mealPlanRecipeTable.createdAt,
      updatedAt: mealPlanRecipeTable.updatedAt,
      recipe: {
        imageSrc: recipeTable.imageSrc,
        createdAt: recipeTable.createdAt,
        updatedAt: recipeTable.updatedAt,
        id: recipeTable.id,
        name: recipeTable.name,
        description: recipeTable.description,
      },
    })
    .from(mealPlanRecipeTable)
    .innerJoin(recipeTable, eq(mealPlanRecipeTable.recipeId, recipeTable.id))
    .where(eq(mealPlanRecipeTable.mealPlanId, mealPlanId))
    .orderBy(mealPlanRecipeTable.date, mealPlanRecipeTable.order);

  return {
    ...mealPlan[0],
    recipes,
  };
};
