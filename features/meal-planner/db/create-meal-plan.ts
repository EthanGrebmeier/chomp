import { generateId } from '@/lib/utils';
import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { CreateMealPlanArgs } from '../types';

export const createMealPlan = async ({ mealPlan }: CreateMealPlanArgs) => {
  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(mealPlanTable).values({
    id,
    groceryListId: mealPlan.groceryListId,
    name: mealPlan.name,
    startDate: mealPlan.startDate,
    endDate: mealPlan.endDate,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
};
