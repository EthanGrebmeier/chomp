import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export const deleteMealPlan = async (mealPlanId: string) => {
  await db.transact([tx.meal_plans[mealPlanId].delete()]);
};
