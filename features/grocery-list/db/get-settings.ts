import { eq } from 'drizzle-orm';

import { appSettingsTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const getSettings = async () => {
  const result = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, 'default'))
    .limit(1);

  if (result.length === 0) {
    // Create default settings if they don't exist
    const now = new Date().toISOString();
    const defaultSettings = {
      id: 'default',
      listName: 'Shopping List',
      groupBy: 'none' as const,
      sortBy: 'recent' as const,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(appSettingsTable).values(defaultSettings);
    return defaultSettings;
  }

  return result[0];
};

