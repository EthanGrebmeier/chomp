import { appSettingsTable } from '../../db/schema';
import { Recipe } from '../recipes/types';

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
};

export type BaseGroceryItem = Omit<
  GroceryListItem,
  'id' | 'isChecked' | 'createdAt' | 'updatedAt'
>;

export type GroceryListItem = {
  name: string;
  category?: string;
  id: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isChecked: boolean;
};
