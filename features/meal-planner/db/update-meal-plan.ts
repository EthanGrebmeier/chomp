import { eq } from 'drizzle-orm';
import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { UpdateMealPlanArgs } from '../types';

export const updateMealPlan = async ({
  mealPlanId,
  updates,
}: UpdateMealPlanArgs) => {
  await db
    .update(mealPlanTable)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mealPlanTable.id, mealPlanId));
};
