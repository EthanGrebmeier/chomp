import { useMutation } from '@tanstack/react-query';

import { addMealsToGroceryList } from '../instant/add-meals-to-grocery-list';

export const useAddMealsToGroceryList = () => {
  return useMutation({
    mutationFn: addMealsToGroceryList,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
