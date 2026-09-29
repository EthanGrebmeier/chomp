import { useEffect, useRef } from 'react';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import { reconcileMealPlanList } from '../instant/reconcile-meal-plan-list';
import { useMealPlanData } from '../instant/use-user-meal-plan-data';

/** Lets the list settle (and quick list switches pass) before reconciling. */
const RECONCILE_DEBOUNCE_MS = 1500;

/** Lists with a reconcile in flight, shared across mounted screens. */
const listsBeingReconciled = new Set<string>();

type UseMealPlanListReconcilerArgs = {
  /** List to reconcile; `undefined` does nothing. */
  listId: string | undefined;
  /** True once the grocery list's items have loaded. */
  isGroceryListReady: boolean;
};

/**
 * Repairs drift between a list's meal plan and its linked grocery items once
 * per list load (see `reconcileMealPlanList`). Waits until the meal plan, the
 * grocery items and the stores (for the default store) have loaded, then
 * reconciles after a short debounce. Switching lists reconciles the new one.
 */
export const useMealPlanListReconciler = ({
  listId,
  isGroceryListReady,
}: UseMealPlanListReconcilerArgs) => {
  const { isLoading: isMealPlanLoading } = useMealPlanData(listId);
  const { data: defaultStore, isLoading: isStoresLoading } = useDefaultStore();
  const defaultStoreRef = useRef(defaultStore);
  defaultStoreRef.current = defaultStore;
  const reconciledListIdsRef = useRef(new Set<string>());

  const isReady =
    listId !== undefined &&
    isGroceryListReady &&
    !isMealPlanLoading &&
    !isStoresLoading;

  useEffect(() => {
    if (
      !isReady ||
      !listId ||
      reconciledListIdsRef.current.has(listId) ||
      listsBeingReconciled.has(listId)
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      if (listsBeingReconciled.has(listId)) {
        return;
      }
      reconciledListIdsRef.current.add(listId);
      listsBeingReconciled.add(listId);
      reconcileMealPlanList({ listId, defaultStore: defaultStoreRef.current })
        .catch(error => {
          console.error('Failed to reconcile meal plan with list:', error);
        })
        .finally(() => {
          listsBeingReconciled.delete(listId);
        });
    }, RECONCILE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [isReady, listId]);
};
