import { eq } from 'drizzle-orm';
import { mealPlanRecipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { UpdateMealPlanRecipeArgs } from '../types';

export const updateMealPlanRecipe = async ({
  mealPlanRecipeId,
  updates,
}: UpdateMealPlanRecipeArgs) => {
  await db
    .update(mealPlanRecipeTable)
    .set(updates)
    .where(eq(mealPlanRecipeTable.id, mealPlanRecipeId));
};
