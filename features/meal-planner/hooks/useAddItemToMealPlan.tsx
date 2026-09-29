import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  addItemToDate,
  type AddItemToDateArgs,
} from '../instant/add-item-to-meal-plan';

/** Adds a standalone item to the meal plan, applying the default store to its linked grocery item. */
export const useAddItemToDate = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<AddItemToDateArgs, 'defaultStore'>) =>
      addItemToDate({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
