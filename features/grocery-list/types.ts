import { appSettingsTable } from '../../db/schema';
import { Recipe } from '../recipes/types';

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
};

export type BaseGroceryItem = {
  name: string;
  category?: string;
};

export type GroceryListItem = BaseGroceryItem & {
  id: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  isChecked: boolean;
};
