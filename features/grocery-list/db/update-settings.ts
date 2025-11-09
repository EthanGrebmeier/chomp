import { appSettingsTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { eq } from 'drizzle-orm';

type UpdateSettingsArgs = {
  listName?: string;
  groupBy?: 'category' | 'none' | 'recipe';
  sortBy?: 'name' | 'recent';
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

