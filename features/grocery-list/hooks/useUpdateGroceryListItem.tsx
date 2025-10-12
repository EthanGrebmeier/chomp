import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateListItem } from '../db/update-list-item';
import { queryKeys } from '../query-keys';

export const useUpdateGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateListItem,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
