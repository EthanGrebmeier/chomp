import { eq } from 'drizzle-orm';
import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const deleteMealPlan = async (mealPlanId: string) => {
  await db.delete(mealPlanTable).where(eq(mealPlanTable.id, mealPlanId));
};
