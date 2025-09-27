import { GroceryList, GroceryListItem, GroceryListWithItems } from './types';

export const normalizeGroceryList = (
  dbResult: {
    grocery_list: GroceryList;
    grocery_list_item: GroceryListItem | null;
  }[]
) => {
  return dbResult.reduce<Record<string, GroceryListWithItems>>((acc, curr) => {
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
  }, {});
};
