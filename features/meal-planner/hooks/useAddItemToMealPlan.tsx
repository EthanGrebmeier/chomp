import { useMutation } from '@tanstack/react-query';

import { addItemToDate } from '../instant/add-item-to-meal-plan';

export const useAddItemToDate = () => {
  return useMutation({
    mutationFn: addItemToDate,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};

