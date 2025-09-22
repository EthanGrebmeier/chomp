import { queryOptions, useQuery } from '@tanstack/react-query';

import { eq } from 'drizzle-orm';
import { groceryListItemTable, groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { queryKeys } from '../query-keys';

type GroceryList = typeof groceryListTable.$inferSelect;
type GroceryListItem = typeof groceryListItemTable.$inferSelect;

type GroceryListWithItems = GroceryList & {
  items: GroceryListItem[];
};

type GroceryLists = Record<string, GroceryListWithItems>;

const groceryListQuery = queryOptions({
  queryKey: queryKeys.base(),
  queryFn: async () => {
    const groceryList = await db
      .select()
      .from(groceryListTable)
      .innerJoin(
        groceryListItemTable,
        eq(groceryListTable.id, groceryListItemTable.groceryListId)
      );

    const result = groceryList.reduce<GroceryLists>((acc, curr) => {
      if (!acc[curr.grocery_list.id]) {
        acc[curr.grocery_list.id] = {
          ...curr.grocery_list,
          items: [],
        };
      }
      acc[curr.grocery_list.id].items.push(curr.grocery_list_item);
      return acc;
    }, {});

    return Object.values(result);
  },
});

export const useGroceryLists = () => {
  return useQuery(groceryListQuery);
};
