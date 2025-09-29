import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateList } from '../db/update-list';
import { queryKeys } from '../query-keys';

export const useUpdateGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateList,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
