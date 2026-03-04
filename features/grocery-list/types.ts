import { InstaQLEntity } from '@instantdb/react-native';

import { appSettingsTable } from '../../db/schema';
import schema from '../../instant.schema';
import { Recipe } from '../recipes/types';
import { Store } from '../stores/types';

export type GroceryListLinkedSavedItem = InstaQLEntity<
  typeof schema,
  'saved_items',
  { user: {}; store: {} }
>;

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
  store?: Store | null;
  saved_item?: GroceryListLinkedSavedItem | null;
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
