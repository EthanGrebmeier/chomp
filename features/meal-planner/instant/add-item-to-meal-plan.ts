import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddItemToMealPlanArgs = {
  mealPlanId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date: string;
  mealTag?: string;
};

export const addItemToMealPlan = async ({
  mealPlanId,
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  date,
  mealTag,
}: AddItemToMealPlanArgs) => {
  const mealPlanItemId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.meal_plan_items[mealPlanItemId].update({
      name,
      quantity,
      unit,
      notes,
      category,
      mealTag,
      date,
      createdAt: now,
      updatedAt: now,
    }),
    tx.meal_plan_items[mealPlanItemId].link({
      meal_plan: mealPlanId,
    }),
  ];

  // Add store link if provided
  if (storeId) {
    transactions.push(
      tx.meal_plan_items[mealPlanItemId].link({
        store: storeId,
      })
    );
  }

  await db.transact(transactions);

  return { id: mealPlanItemId };
};

