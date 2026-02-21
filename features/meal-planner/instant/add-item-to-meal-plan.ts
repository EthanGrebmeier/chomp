import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { addSavedItemIfNotExists } from '../../saved-items/instant/add-saved-item-if-not-exists';

export type AddItemToDateArgs = {
  listId: string;
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
  listId,
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  date,
  mealTag,
}: AddItemToDateArgs) => {
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
      grocery_list: listId,
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

  addSavedItemIfNotExists({
    name,
    category,
  });

  return { id: mealPlanItemId };
};

