import { useMutation } from '@tanstack/react-query';

import { addRecipeToList } from '../instant/add-recipe-to-list';

export const useAddRecipeToList = () => {
  return useMutation({
    mutationFn: addRecipeToList,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
