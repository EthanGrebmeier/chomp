import { useRef } from 'react';
import { toast } from 'sonner-native';

import type { MealPlanEntryRef } from '../instant/meal-plan-entry';

import { useSetMealPlanEntryIgnored } from './useSetMealPlanEntryIgnored';

type UseMealPlanOnlyToggleArgs = {
  entry: MealPlanEntryRef | null;
  /** True when the live entry has no visible linked grocery items. */
  isMealPlanOnly: boolean;
};

/**
 * Shopping visibility and explicit show/hide commands, shared by edit sheets
 * and card context menus. Retains the existing inverse boolean interface.
 * While a change is saving, `isMealPlanOnly` reports the requested value.
 */
export const useMealPlanOnlyToggle = ({
  entry,
  isMealPlanOnly,
}: UseMealPlanOnlyToggleArgs) => {
  const { mutate, isPending, variables } = useSetMealPlanEntryIgnored();
  const inFlightRef = useRef(false);
  const pendingForEntry =
    isPending && variables?.id === entry?.id && variables?.type === entry?.type;

  const setMealPlanOnly = (
    ignored: boolean,
    options?: { onSuccess?: () => void }
  ) => {
    if (!entry) return;
    // Prevent repeated writes while a change is in flight
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    mutate(
      { ...entry, ignored },
      {
        onSuccess: options?.onSuccess,
        onSettled: () => {
          inFlightRef.current = false;
        },
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
    isMealPlanOnly:
      pendingForEntry && variables ? variables.ignored : isMealPlanOnly,
    setMealPlanOnly,
    isPending,
  };
};
