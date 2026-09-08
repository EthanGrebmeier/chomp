import { eq } from 'drizzle-orm';

import { db } from '../../../db/local';
import { appSettingsTable, localSavedItemTable } from '../../../db/schema';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { groceries } from '../../grocery-list/consts/groceries';

const APP_SETTINGS_ID = 'default';
const INSERT_CHUNK_SIZE = 80;

/**
 * Seed the shared local saved item catalog with default grocery items.
 * Runs after migrations. Subsequent launches are a no-op once
 * `hasSeededSavedItems` is set.
 */
export const seedLocalSavedItems = async () => {
  const settings = await db
    .select({ hasSeededSavedItems: appSettingsTable.hasSeededSavedItems })
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, APP_SETTINGS_ID))
    .limit(1);

  if (settings[0]?.hasSeededSavedItems) {
    return 0;
  }

  const now = new Date().toISOString();

  if (settings.length === 0) {
    await db.insert(appSettingsTable).values(
      trimStringFields({
        id: APP_SETTINGS_ID,
        listName: 'Shopping List',
        groupBy: 'none',
        sortBy: 'recent',
        hasSeededSavedItems: false,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  const defaultItems = groceries.map((grocery, index) =>
    trimStringFields({
      id: `local-${index}`,
      name: grocery.name,
      category: grocery.category ?? null,
      notes: null,
      storeId: null,
      ownerId: null,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })
  );

  for (let offset = 0; offset < defaultItems.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = defaultItems.slice(offset, offset + INSERT_CHUNK_SIZE);
    await db
      .insert(localSavedItemTable)
      .values(chunk)
      .onConflictDoNothing();
  }

  await db
    .update(appSettingsTable)
    .set(
      trimStringFields({
        hasSeededSavedItems: true,
        updatedAt: now,
      })
    )
    .where(eq(appSettingsTable.id, APP_SETTINGS_ID));

  return defaultItems.length;
};
