import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearGroceryList } from '../db/clear-list';
import { queryKeys } from '../query-keys';

export const useClearList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearGroceryList,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
