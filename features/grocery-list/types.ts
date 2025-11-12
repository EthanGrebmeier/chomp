import { appSettingsTable, groceryListItemTable } from '../../db/schema';
import { Recipe } from '../recipes/types';
import { Category } from '../shared/category/categories';

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItem = typeof groceryListItemTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
};

export type BaseGroceryItem = {
  name: string;
  category?: Category;
};
