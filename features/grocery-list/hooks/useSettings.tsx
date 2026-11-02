import { queryOptions, useQuery } from '@tanstack/react-query';

import { getSettings } from '../db/get-settings';
import { queryKeys } from '../query-keys';

const settingsQuery = queryOptions({
  queryKey: queryKeys.settings(),
  queryFn: getSettings,
  // SQLite reads must run even when TanStack considers the device offline.
  networkMode: 'always',
});

export const useSettings = () => {
  return useQuery(settingsQuery);
};
