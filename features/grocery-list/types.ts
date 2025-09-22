import { groceryListItemTable, groceryListTable } from '../../db/schema';

export type GroceryList = typeof groceryListTable.$inferSelect;

export type GroceryListItem = typeof groceryListItemTable.$inferInsert;

export type GroceryListWithItems = GroceryList & {
  items: GroceryListItem[];
};
