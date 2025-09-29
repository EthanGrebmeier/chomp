import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateList } from '../db/update-list';
import { queryKeys } from '../query-keys';

export const useUpdateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateList,
    onSuccess: (_, variables) => {
      // Invalidate both the specific list and all lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
