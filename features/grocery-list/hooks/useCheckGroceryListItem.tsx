import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkListItem } from '../db/check-list-item';
import { queryKeys } from '../query-keys';

export const useCheckGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkListItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
