import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateSettings } from '../db/update-settings';
import { queryKeys } from '../query-keys';

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings(),
      });
    },
  });
};
