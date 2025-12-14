import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type UpdateMealPlanArgs = {
  mealPlanId: string;
  updates: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isArchived?: boolean;
  };
};

export const updateMealPlan = async ({
  mealPlanId,
  updates,
}: UpdateMealPlanArgs) => {
  await db.transact([
    tx.meal_plans[mealPlanId].update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  ]);
};
