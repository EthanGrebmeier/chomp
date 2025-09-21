import { queryOptions, useQuery } from '@tanstack/react-query';

import { queryKeys } from '../query-keys';
import { GroceryList } from '../types';

const mockGroceryList: GroceryList = {
  date: '2025-09-21',
  items: [
    {
      id: '1',
      name: 'Apple',
      quantity: 1,
      unit: 'each',
    },
    {
      id: '2',
      name: 'Banana',
      quantity: 2,
      unit: 'each',
    },
    {
      id: '3',
      name: 'Orange',
      quantity: 3,
      unit: 'each',
    },
  ],
};

const groceryListQuery = queryOptions({
  queryKey: queryKeys.base(),
  queryFn: () => {
    return mockGroceryList;
  },
});

export const useGroceryList = () => {
  return useQuery(groceryListQuery);
};
