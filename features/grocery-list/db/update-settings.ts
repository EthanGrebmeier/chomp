import { eq } from 'drizzle-orm';

import { appSettingsTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type UpdateSettingsArgs = {
  listName?: string;
  groupBy?: 'category' | 'none' | 'recipe' | 'store';
  sortBy?: 'name' | 'recent';
  savedItemsSortBy?: 'name' | 'category';
  savedItemsFilterCategory?: string | null;
};

export const updateSettings = async (updates: UpdateSettingsArgs) => {
  const processedUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const result = await db
    .update(appSettingsTable)
    .set(processedUpdates)
    .where(eq(appSettingsTable.id, 'default'))
    .returning();

  return result[0];
};




