import { useMutation, useQueryClient } from '@tanstack/react-query';

import { incrementListItem } from '../db/increment-list-item';
import { queryKeys } from '../query-keys';

export const useIncrementGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incrementListItem,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};

