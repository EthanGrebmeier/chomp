import { eq } from 'drizzle-orm';

import { appSettingsTable, localSavedItemTable } from '../../../db/schema';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { db } from '../../../providers/migration-provider';
import { groceries } from '../../grocery-list/consts/groceries';

const APP_SETTINGS_ID = 'default';

/**
 * Seed the local saved items table with default grocery items.
 * This is called on app startup and only runs once (tracked via app_settings flag).
 */
export const seedLocalSavedItems = async () => {
  // Ensure app_settings row exists
  const settings = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, APP_SETTINGS_ID))
    .limit(1);

  const now = new Date().toISOString();

  if (settings.length === 0) {
    // Create the settings row if it doesn't exist
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

  // Check if we've already seeded
  const currentSettings = await db
    .select({ hasSeededSavedItems: appSettingsTable.hasSeededSavedItems })
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, APP_SETTINGS_ID))
    .limit(1);

  if (currentSettings[0]?.hasSeededSavedItems) {
    // Already seeded, skip
    return;
  }

  // Generate IDs using the item name as a stable key (prefixed with 'local-')
  const itemsToInsert = groceries.map((grocery, index) =>
    trimStringFields({
      id: `local-${index}`,
      name: grocery.name,
      category: grocery.category ?? null,
      createdAt: now,
      updatedAt: now,
    })
  );

  // Insert in chunks to avoid hitting SQLite limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
    const chunk = itemsToInsert.slice(i, i + CHUNK_SIZE);
    await db.insert(localSavedItemTable).values(chunk);
  }

  // Mark as seeded
  await db
    .update(appSettingsTable)
    .set(
      trimStringFields({
        hasSeededSavedItems: true,
        updatedAt: now,
      })
    )
    .where(eq(appSettingsTable.id, APP_SETTINGS_ID));

  console.log(`Seeded ${itemsToInsert.length} local saved items`);
};
