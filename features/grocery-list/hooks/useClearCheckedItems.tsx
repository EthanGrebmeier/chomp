import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearCheckedItems } from '../db/clear-checked-items';
import { queryKeys } from '../query-keys';

export const useClearCheckedItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCheckedItems,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
  });
};
