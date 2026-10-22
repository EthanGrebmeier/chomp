import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

import {
  type LinkedGroceryItemPatch,
  type ListToMealPlanWriteBackPlan,
  type MealPlanWriteBackSource,
  planListToMealPlanWriteBack,
} from './plan-list-to-meal-plan-write-back';

type StoreLinkable = {
  link: (link: { store: string }) => TransactionChunk;
  unlink: (link: { store: string }) => TransactionChunk;
};

const buildStoreTransactions = (
  entity: StoreLinkable,
  store: NonNullable<ListToMealPlanWriteBackPlan['store']>
): TransactionChunk[] => [
  ...(store.previousStoreId
    ? [entity.unlink({ store: store.previousStoreId })]
    : []),
  ...(store.nextStoreId ? [entity.link({ store: store.nextStoreId })] : []),
];

/**
 * Turns a `planListToMealPlanWriteBack` plan into transaction chunks, so the
 * grocery item edit and its meal plan write-back land in one `db.transact`.
 */
export const buildListToMealPlanWriteBackTransactions = (
  plan: ListToMealPlanWriteBackPlan | null,
  now: string = new Date().toISOString()
): TransactionChunk[] => {
  if (!plan) return [];

  const { source, fields, store } = plan;
  const hasFields = Object.keys(fields).length > 0;

  if (source.type === 'snapshot') {
    const entity = tx.meal_plan_recipe_ingredient_snapshots[source.snapshotId];
    return [
      ...(hasFields ? [entity.update(fields)] : []),
      ...(store ? buildStoreTransactions(entity, store) : []),
    ];
  }

  const { isQuantityOverridden: _isQuantityOverridden, ...itemFields } = fields;
  const entity = tx.meal_plan_items[source.mealPlanItemId];
  return [
    entity.update({ ...itemFields, updatedAt: now }),
    ...(store ? buildStoreTransactions(entity, store) : []),
  ];
};

/** Plans and builds the write-back of one linked grocery item edit. */
export const buildLinkedGroceryItemWriteBackTransactions = ({
  source,
  patch,
  now,
}: {
  source: MealPlanWriteBackSource | null | undefined;
  patch: LinkedGroceryItemPatch;
  now?: string;
}): TransactionChunk[] =>
  buildListToMealPlanWriteBackTransactions(
    planListToMealPlanWriteBack({ source, patch }),
    now
  );
