import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  setMealPlanEntryIgnored,
  type SetMealPlanEntryIgnoredArgs,
} from '../instant/meal-plan-entry';

/**
 * Turns "meal plan only" on or off for a meal plan recipe or item, applying
 * the default store to any linked grocery items it re-creates.
 */
export const useSetMealPlanEntryIgnored = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<SetMealPlanEntryIgnoredArgs, 'defaultStore'>) =>
      setMealPlanEntryIgnored({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
