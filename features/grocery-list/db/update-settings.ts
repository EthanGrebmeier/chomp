import { eq } from 'drizzle-orm';

import { appSettingsTable } from '../../../db/schema';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { db } from '../../../providers/migration-provider';
import { GroceryListGroupBy, GroceryListSortBy } from '../types';

type UpdateSettingsArgs = {
  listName?: string;
  groupBy?: GroceryListGroupBy;
  sortBy?: GroceryListSortBy;
  savedItemsSortBy?: 'name' | 'category';
  savedItemsFilterCategory?: string | null;
};

export const updateSettings = async (updates: UpdateSettingsArgs) => {
  const processedUpdates = trimStringFields({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const result = await db
    .update(appSettingsTable)
    .set(processedUpdates)
    .where(eq(appSettingsTable.id, 'default'))
    .returning();

  return result[0];
};




