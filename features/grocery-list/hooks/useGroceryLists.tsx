import { queryOptions, useQuery } from '@tanstack/react-query';

import { getLists } from '../db/get-lists';
import { queryKeys } from '../query-keys';

const groceryListQuery = queryOptions({
  queryKey: queryKeys.base(),
  queryFn: getLists,
});

export const useGroceryLists = () => {
  return useQuery(groceryListQuery);
};
