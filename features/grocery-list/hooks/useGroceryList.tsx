import { queryOptions, useQuery } from '@tanstack/react-query';
import { getList } from '../db/get-list';
import { queryKeys } from '../query-keys';

const groceryListQuery = (listId: string) =>
  queryOptions({
    queryKey: queryKeys.list(listId),
    queryFn: () => getList(listId),
  });

export const useGroceryList = (listId: string) => {
  return useQuery(groceryListQuery(listId));
};
