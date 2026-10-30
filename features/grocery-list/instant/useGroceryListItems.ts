import { useMemo } from 'react';

import { createGroceryProjector } from '@/features/quantity/app/projection';
import { useQuantityList } from '@/features/quantity/app/session';
import { quantityWorkspaceAvailable } from '@/features/quantity/config';

import { db } from '../../../lib/instant';
import {
  applyPendingCheckedState,
  usePendingCheckedState,
} from '../pending-checked-state';
import { GroceryListItemWithRecipe } from '../types';

const EMPTY_ITEMS: GroceryListItemWithRecipe[] = [];

/**
 * Live items for a single grocery list.
 *
 * Scoped to one list so a collaborator's write on another list does not
 * re-emit this subscription. The linked relations are the ones the item row,
 * edit sheet, and bulk actions read (`recipe`, `store`, `saved_item` + its
 * `store`/`user`, and the meal plan source: `meal_plan_ingredient_snapshot`
 * + its `meal_plan_recipe` and that entry's snapshot selection (for delete
 * write-back), or `meal_plan_item`, each with its own `store`
 * for write-back).
 *
 * `isChecked` reflects any in-flight toggle from `checkListItem`, so a
 * write the InstantDB client has timed out (and is being retried) does not
 * snap the row back to the server value.
 *
 * Passing `undefined` skips the query.
 */
export const useGroceryListItems = (listId: string | undefined) => {
  const quantity = useQuantityList(listId);
  const enabled = quantityWorkspaceAvailable();
  const stores = db.useQuery(enabled ? { stores: {} } : null);
  const project = useMemo(() => createGroceryProjector(), []);
  const projected = useMemo(
    () => project(quantity.state, stores.data?.stores),
    [project, quantity.state, stores.data]
  );
  const query = db.useQuery(
    listId && !enabled
      ? {
          grocery_items: {
            $: {
              where: {
                'grocery_list.id': listId,
                isDeleted: false,
              },
              order: { createdAt: 'desc' },
            },
            recipe: {},
            store: {},
            saved_item: {
              store: {},
              user: {},
            },
            meal_plan_ingredient_snapshot: {
              meal_plan_recipe: {
                ingredient_snapshots: {},
              },
              store: {},
            },
            meal_plan_item: {
              store: {},
            },
          },
        }
      : null
  );
  const pendingCheckedState = usePendingCheckedState(!enabled);

  const queriedItems = query.data?.grocery_items ?? EMPTY_ITEMS;
  const items = useMemo(
    () => applyPendingCheckedState(queriedItems, pendingCheckedState),
    [pendingCheckedState, queriedItems]
  );

  return {
    items: enabled ? projected : items,
    isLoading: enabled
      ? quantity.loading || stores.isLoading
      : listId
        ? query.isLoading
        : false,
    error: enabled
      ? quantity.error
        ? { message: quantity.error }
        : stores.error
      : query.error,
  };
};
