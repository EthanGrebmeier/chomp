import { generateId } from '@/lib/utils';

import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { CreateMealPlanArgs } from '../types';

export const createMealPlan = async ({ mealPlan }: CreateMealPlanArgs) => {
  const id = generateId();
  const now = new Date().toISOString();

  // Archive all existing meal plans
  await db.update(mealPlanTable).set({ isArchived: true, updatedAt: now });

  // Create the new meal plan (isArchived defaults to false)
  await db.insert(mealPlanTable).values({
    id,
    name: mealPlan.name,
    startDate: mealPlan.startDate,
    endDate: mealPlan.endDate,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
};
