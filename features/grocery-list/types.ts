import { groceryListItemTable, groceryListTable } from '../../db/schema';
import { Recipe } from '../recipes/types';

export type GroceryList = typeof groceryListTable.$inferSelect;

export type GroceryListItem = typeof groceryListItemTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
};

export type GroceryListWithItems = GroceryList & {
  items: GroceryListItemWithRecipe[];
};

export type UpdateGroceryListArgs = {
  listId: string;
  updates: {
    name?: string;
    date?: string;
    groupBy?: 'category' | 'none' | 'recipe';
    sortBy?: 'name' | 'recent';
  };
};
