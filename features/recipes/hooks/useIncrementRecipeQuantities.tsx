import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys as groceryListQueryKeys } from '../../grocery-list/query-keys';
import { incrementRecipeQuantities } from '../db/increment-recipe-quantities';

export const useIncrementRecipeQuantities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incrementRecipeQuantities,
    onSuccess: () => {
      // Invalidate grocery list queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: groceryListQueryKeys.items(),
      });
      queryClient.invalidateQueries({
        queryKey: groceryListQueryKeys.base(),
      });
    },
  });
};
