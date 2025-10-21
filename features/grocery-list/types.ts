import { groceryListItemTable, groceryListTable } from '../../db/schema';
import { Recipe } from '../recipes/types';
import { Item } from '../shared/types';

export type GroceryList = typeof groceryListTable.$inferSelect;

export type GroceryListItem = typeof groceryListItemTable.$inferSelect;

export type GroceryListItemWithItem = GroceryListItem & {
  item: Item;
  recipe?: Recipe | null;
};

export type GroceryListWithItems = GroceryList & {
  items: GroceryListItemWithItem[];
};

export type UpdateGroceryListArgs = {
  listId: string;
  updates: {
    name?: string;
    date?: string;
    groupBy?: 'category' | 'none';
  };
};
