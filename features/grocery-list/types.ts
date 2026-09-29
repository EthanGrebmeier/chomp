import { InstaQLEntity } from '@instantdb/react-native';

import { appSettingsTable } from '../../db/schema';
import schema from '../../instant.schema';
import { Recipe } from '../recipes/types';
import { Store } from '../stores/types';

export type GroceryListGroupBy = 'category' | 'none' | 'recipe' | 'store';
export type GroceryListSortBy =
  | 'category'
  | 'name'
  | 'recent'
  | 'recipe'
  | 'store';

export type GroceryListLinkedSavedItem = InstaQLEntity<
  typeof schema,
  'saved_items',
  { user: {}; store: {} }
>;

/** Recipe ingredient snapshot a linked grocery item was created from. */
export type GroceryListLinkedMealPlanIngredientSnapshot = InstaQLEntity<
  typeof schema,
  'meal_plan_recipe_ingredient_snapshots',
  { meal_plan_recipe: { ingredient_snapshots: {} }; store: {} }
>;

/** Standalone meal plan item a linked grocery item was created from. */
export type GroceryListLinkedMealPlanItem = InstaQLEntity<
  typeof schema,
  'meal_plan_items',
  { store: {} }
>;

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
  store?: Store | null;
  saved_item?: GroceryListLinkedSavedItem | null;
  meal_plan_ingredient_snapshot?: GroceryListLinkedMealPlanIngredientSnapshot | null;
  meal_plan_item?: GroceryListLinkedMealPlanItem | null;
};

export type BaseGroceryItem = Omit<
  GroceryListItem,
  'id' | 'isChecked' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'
> & {
  storeId?: string;
};

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
  isDeleted: boolean;
  deletedAt?: string;
};
