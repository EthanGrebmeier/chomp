import { InstaQLEntity } from '@instantdb/react-native';

import { appSettingsTable } from '../../db/schema';
import schema from '../../instant.schema';
import { Store } from '../stores/types';
import { Recipe } from '../recipes/types';

export type AppSettings = typeof appSettingsTable.$inferSelect;

export type GroceryListItemWithRecipe = GroceryListItem & {
  recipe?: Recipe | null;
  store?: Store | null;
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
