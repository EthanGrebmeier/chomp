import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const getMealPlans = async () => {
  const mealPlans = await db
    .select()
    .from(mealPlanTable)
    .orderBy(mealPlanTable.createdAt);

  return mealPlans;
};
