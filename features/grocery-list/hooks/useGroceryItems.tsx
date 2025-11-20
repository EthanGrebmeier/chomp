import { queryOptions, useQuery } from '@tanstack/react-query';

import { getItems } from '../db/get-items';
import { queryKeys } from '../query-keys';

const groceryItemsQuery = queryOptions({
  queryKey: queryKeys.items(),
  queryFn: getItems,
});

export const useGroceryItems = () => {
  return useQuery(groceryItemsQuery);
};




