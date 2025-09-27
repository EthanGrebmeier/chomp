import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeListItem } from '../db/remove-list-item';
import { queryKeys } from '../query-keys';

export const useRemoveGroceryListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeListItem,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
