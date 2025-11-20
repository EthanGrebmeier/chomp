import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSeparateListItem } from '../db/create-separate-list-item';
import { queryKeys } from '../query-keys';

export const useCreateSeparateGroceryListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSeparateListItem,
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};

