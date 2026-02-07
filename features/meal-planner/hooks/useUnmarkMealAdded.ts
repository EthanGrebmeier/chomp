import { useMutation } from '@tanstack/react-query';

import { unmarkMealAdded } from '../instant/unmark-meal-added';

export const useUnmarkMealAdded = () => {
  return useMutation({
    mutationFn: unmarkMealAdded,
  });
};
