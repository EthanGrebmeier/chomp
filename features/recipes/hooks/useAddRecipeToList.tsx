import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys as groceryListQueryKeys } from '../../grocery-list/query-keys';
import { addRecipeToList } from '../db/add-recipe-to-list';

export const useAddRecipeToList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRecipeToList,
    onSuccess: (_, variables) => {
      // Invalidate grocery list queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: groceryListQueryKeys.list(variables.groceryListId),
      });
      queryClient.invalidateQueries({
        queryKey: groceryListQueryKeys.base(),
      });
    },
  });
};
