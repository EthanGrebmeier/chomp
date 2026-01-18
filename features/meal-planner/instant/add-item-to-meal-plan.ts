import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type AddItemToDateArgs = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date: string;
  mealTag?: string;
};

export const addItemToDate = async ({
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  date,
  mealTag,
}: AddItemToDateArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const mealPlanItemId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.meal_plan_items[mealPlanItemId].update(
      trimStringFields({
        name,
        quantity,
        unit,
        notes,
        category,
        mealTag,
        date,
        addedToList: false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.meal_plan_items[mealPlanItemId].link({
      user: user.id,
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

