import { eq } from 'drizzle-orm';
import { groceryListItemTable, groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GroceryListWithItems } from '../types';

export const getLists = async () => {
  const groceryList = await db
    .select()
    .from(groceryListTable)
    .leftJoin(
      groceryListItemTable,
      eq(groceryListTable.id, groceryListItemTable.groceryListId)
    );
  const result = groceryList.reduce<Record<string, GroceryListWithItems>>(
    (acc, curr) => {
      if (!acc[curr.grocery_list.id]) {
        acc[curr.grocery_list.id] = {
          ...curr.grocery_list,
          items: [],
        };
      }
      if (curr.grocery_list_item) {
        acc[curr.grocery_list.id].items.push(curr.grocery_list_item);
      }
      return acc;
    },
    {}
  );

  return Object.values(result);
};
