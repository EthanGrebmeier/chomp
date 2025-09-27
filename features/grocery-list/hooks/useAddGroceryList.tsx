import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createList } from '../db/create-list';
import { queryKeys } from '../query-keys';

export const useAddGroceryList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
