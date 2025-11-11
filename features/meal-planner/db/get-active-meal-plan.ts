import { and, desc, eq, gte, lte } from 'drizzle-orm';

import {
  mealPlanRecipeTable,
  mealPlanTable,
  recipeTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { MealPlanWithRecipes } from '../types';

export const getActiveMealPlan = async (): Promise<MealPlanWithRecipes | null> => {
  // Get today's date at midnight in ISO format
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Get the most recently created active meal plan (not archived)
  const activeMealPlans = await db
    .select()
    .from(mealPlanTable)
    .where(
      and(
        eq(mealPlanTable.isArchived, false),
        lte(mealPlanTable.startDate, todayStr),
        gte(mealPlanTable.endDate, todayStr)
      )
    )
    .orderBy(desc(mealPlanTable.createdAt))
    .limit(1);

  if (activeMealPlans.length === 0) {
    return null;
  }

  const mealPlan = activeMealPlans[0];

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
    .where(eq(mealPlanRecipeTable.mealPlanId, mealPlan.id))
    .orderBy(mealPlanRecipeTable.date, mealPlanRecipeTable.order);

  return {
    ...mealPlan,
    recipes,
  };
};

