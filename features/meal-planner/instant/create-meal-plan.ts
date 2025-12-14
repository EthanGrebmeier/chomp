import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type CreateMealPlanArgs = {
  mealPlan: {
    name: string;
    startDate: string;
    endDate: string;
  };
};

export const createMealPlan = async ({ mealPlan }: CreateMealPlanArgs) => {
  const mealPlanId = id();
  const now = new Date().toISOString();

  // First, archive all existing meal plans
  const existingPlans = await db.queryOnce({
    meal_plans: {
      $: {
        where: {
          isArchived: false,
        },
      },
    },
  });

  const transactions = [];

  // Archive existing plans
  for (const plan of existingPlans.data.meal_plans || []) {
    transactions.push(
      tx.meal_plans[plan.id].update({
        isArchived: true,
        updatedAt: now,
      })
    );
  }

  // Create the new meal plan
  transactions.push(
    tx.meal_plans[mealPlanId].update({
      name: mealPlan.name,
      startDate: mealPlan.startDate,
      endDate: mealPlan.endDate,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })
  );

  await db.transact(transactions);

  return { id: mealPlanId };
};
