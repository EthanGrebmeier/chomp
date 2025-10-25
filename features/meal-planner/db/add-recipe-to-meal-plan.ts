import { generateId } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';
import { mealPlanRecipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { AddRecipeToMealPlanArgs } from '../types';

export const addRecipeToMealPlan = async ({
  mealPlanId,
  recipeId,
  date,
  mealTag,
  servings = 1,
}: AddRecipeToMealPlanArgs) => {
  const id = generateId();

  // Get the next order number for this date
  const existingRecipes = await db
    .select({ order: mealPlanRecipeTable.order })
    .from(mealPlanRecipeTable)
    .where(
      and(
        eq(mealPlanRecipeTable.mealPlanId, mealPlanId),
        eq(mealPlanRecipeTable.date, date)
      )
    )
    .orderBy(mealPlanRecipeTable.order);

  const nextOrder =
    existingRecipes.length > 0
      ? Math.max(...existingRecipes.map(r => r.order)) + 1
      : 0;

  const now = new Date().toISOString();
  await db.insert(mealPlanRecipeTable).values({
    id,
    mealPlanId,
    recipeId,
    mealTag,
    date,
    servings,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
};
