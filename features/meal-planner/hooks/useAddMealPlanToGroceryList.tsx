import { useMutation } from '@tanstack/react-query';

import { db } from '../../../lib/instant';
import { useGroceryListItems } from '../../grocery-list/instant/useGroceryListItems';
import { toExistingIngredientsForStacking } from '../../recipes/instant/stack-recipe-ingredients';
import { useDefaultStore } from '../../stores/instant/use-default-store';
import { addMealsToGroceryList } from '../instant/add-meals-to-grocery-list';
import { AddMealsSelection } from '../instant/plan-add-meals-to-grocery-list';

import { useUserMealPlanData } from './useUserMealPlanData';

/**
 * Adds meal plan entries for `listId` to that list.
 *
 * Reads meal plan entries, current list items, and the default store from
 * live subscriptions (which the meal planner and list screens already hold),
 * so the write happens immediately instead of after server round trips.
 */
export const useAddMealsToGroceryList = (listId: string) => {
  const { user } = db.useAuth();
  const { recipes, items } = useUserMealPlanData(listId);
  const { items: listItems, isLoading: isLoadingListItems } =
    useGroceryListItems(listId);
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (selection: AddMealsSelection) =>
      addMealsToGroceryList({
        listId,
        recipes,
        items,
        // Fall back to a server fetch rather than stacking against an empty list.
        existingItems: isLoadingListItems
          ? undefined
          : toExistingIngredientsForStacking(listItems),
        defaultStore,
        userId: user?.id,
        ...selection,
      }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
