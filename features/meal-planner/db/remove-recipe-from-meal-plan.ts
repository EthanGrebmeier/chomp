import { eq } from 'drizzle-orm';
import { mealPlanRecipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { RemoveRecipeFromMealPlanArgs } from '../types';

export const removeRecipeFromMealPlan = async ({
  mealPlanRecipeId,
}: RemoveRecipeFromMealPlanArgs) => {
  await db
    .delete(mealPlanRecipeTable)
    .where(eq(mealPlanRecipeTable.id, mealPlanRecipeId));
};
