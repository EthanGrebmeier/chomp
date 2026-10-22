import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import { buildMealPlanListReconciliationTransactions } from './build-meal-plan-list-reconciliation-transactions';
import {
  isMealPlanListReconciliationPlanEmpty,
  type ListLinkedGroceryItem,
  type MealPlanItemReconciliationRow,
  type MealPlanRecipeReconciliationRow,
  planMealPlanListReconciliation,
} from './plan-meal-plan-list-reconciliation';

/**
 * Loads a list's meal plan and its meal-plan-linked grocery items in one
 * query, so the reconciler plans against a consistent snapshot rather than
 * two subscriptions that may be momentarily out of step.
 */
const queryMealPlanListReconciliationData = async (listId: string) => {
  const result = await db.queryOnce({
    grocery_lists: {
      $: { where: { id: listId } },
      meal_plan_recipes: {
        recipe: {
          recipe_ingredients: {
            store: {},
          },
        },
        ingredient_snapshots: {
          store: {},
          grocery_item: {
            store: {},
          },
        },
      },
      meal_plan_items: {
        store: {},
        grocery_item: {
          store: {},
        },
      },
      grocery_items: {
        $: {
          where: {
            'meal_plan_ingredient_snapshot.id': { $isNull: false },
          },
        },
        store: {},
        meal_plan_ingredient_snapshot: {},
      },
    },
    // Instant's types reject an `or` over two different link paths, so the
    // two kinds of linked items are fetched as two branches of this query.
    grocery_items: {
      $: {
        where: {
          'grocery_list.id': listId,
          'meal_plan_item.id': { $isNull: false },
        },
      },
      store: {},
      meal_plan_item: {},
    },
  });
  const list = result.data.grocery_lists[0];

  return list
    ? {
        recipeRows: (list.meal_plan_recipes ??
          []) as MealPlanRecipeReconciliationRow[],
        itemRows: (list.meal_plan_items ??
          []) as MealPlanItemReconciliationRow[],
        linkedGroceryItems: [
          ...(list.grocery_items ?? []),
          ...result.data.grocery_items,
        ] as ListLinkedGroceryItem[],
      }
    : null;
};

/**
 * Repairs drift between a list's meal plan and its linked grocery items (see
 * `planMealPlanListReconciliation`), writing one transaction only when there
 * is something to fix. Returns whether it wrote.
 */
export const reconcileMealPlanList = async ({
  listId,
  defaultStore,
}: {
  listId: string;
  /** List default store, applied to created linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
}): Promise<boolean> => {
  const data = await queryMealPlanListReconciliationData(listId);
  if (!data) {
    return false;
  }

  const plan = planMealPlanListReconciliation({
    ...data,
    defaultStore,
    createId: id,
  });
  if (isMealPlanListReconciliationPlanEmpty(plan)) {
    return false;
  }

  await db.transact(
    buildMealPlanListReconciliationTransactions({ listId, plan })
  );
  return true;
};
