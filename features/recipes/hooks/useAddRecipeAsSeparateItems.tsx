import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys as groceryListQueryKeys } from '../../grocery-list/query-keys';
import { addRecipeAsSeparateItems } from '../db/add-recipe-separate-items';

export const useAddRecipeAsSeparateItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRecipeAsSeparateItems,
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
