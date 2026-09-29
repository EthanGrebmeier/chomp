import { toast } from 'sonner-native';

import type { MealPlanEntryRef } from '../instant/meal-plan-entry';

import { useSetMealPlanEntryIgnored } from './useSetMealPlanEntryIgnored';

type UseMealPlanOnlyToggleArgs = {
  entry: MealPlanEntryRef | null;
  /** Live "meal plan only" state of the entry. */
  isMealPlanOnly: boolean;
};

/**
 * "Meal plan only" state and setter for one meal plan entry, shared by the
 * edit sheets and card context menus so recipes and items behave the same.
 * While a change is saving, `isMealPlanOnly` reports the requested value.
 */
export const useMealPlanOnlyToggle = ({
  entry,
  isMealPlanOnly,
}: UseMealPlanOnlyToggleArgs) => {
  const { mutate, isPending, variables } = useSetMealPlanEntryIgnored();

  const setMealPlanOnly = (
    ignored: boolean,
    options?: { onSuccess?: () => void }
  ) => {
    if (!entry) return;
    mutate(
      { ...entry, ignored },
      {
        onSuccess: options?.onSuccess,
        onError: () => {
          toast.error(
            ignored
              ? 'Failed to remove from grocery list'
              : 'Failed to add to grocery list'
          );
        },
      }
    );
  };

  return {
    isMealPlanOnly: isPending && variables ? variables.ignored : isMealPlanOnly,
    setMealPlanOnly,
  };
};
