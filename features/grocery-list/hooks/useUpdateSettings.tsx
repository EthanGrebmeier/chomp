import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateSettings } from '../db/update-settings';
import { queryKeys } from '../query-keys';

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    scope: { id: 'settings' },
    mutationFn: updateSettings,
    onSuccess: settings => {
      // Publish the durable SQLite result immediately; no extra read/render gap.
      queryClient.setQueryData(queryKeys.settings(), settings);
    },
  });
};
