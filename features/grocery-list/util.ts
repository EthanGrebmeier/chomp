import { Item } from '../shared/types';
import {
  GroceryList,
  GroceryListItem,
  GroceryListItemWithItem,
  GroceryListWithItems,
} from './types';

export const normalizeGroceryList = (
  dbResult: {
    grocery_list: GroceryList;
    grocery_list_item: GroceryListItem | null;
    item: Item | null;
  }[]
) => {
  return dbResult.reduce<Record<string, GroceryListWithItems>>((acc, curr) => {
    if (!acc[curr.grocery_list.id]) {
      acc[curr.grocery_list.id] = {
        ...curr.grocery_list,
        items: [],
      };
    }
    if (curr.grocery_list_item && curr.item) {
      const itemWithItem: GroceryListItemWithItem = {
        ...curr.grocery_list_item,
        item: curr.item,
      };
      acc[curr.grocery_list.id].items.push(itemWithItem);
    }
    return acc;
  }, {});
};
