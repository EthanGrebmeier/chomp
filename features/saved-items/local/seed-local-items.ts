import { eq } from 'drizzle-orm';

import { appSettingsTable, localSavedItemTable } from '../../../db/schema';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { db } from '../../../providers/migration-provider';
import { groceries } from '../../grocery-list/consts/groceries';

const APP_SETTINGS_ID = 'default';

/**
 * Seed/reconcile the shared local saved item catalog with default grocery items.
 * This runs after migrations so legacy installs get canonical shared defaults
 * instead of carrying account-specific edits in default rows.
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

  // Generate IDs using the item name as a stable key (prefixed with 'local-')
  const defaultItems = groceries.map((grocery, index) =>
    ({
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

  for (const item of defaultItems) {
    const existing = await db
      .select({ id: localSavedItemTable.id })
      .from(localSavedItemTable)
      .where(eq(localSavedItemTable.id, item.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(localSavedItemTable)
        .set(
          trimStringFields({
            name: item.name,
            category: item.category,
            notes: item.notes,
            storeId: item.storeId,
            ownerId: item.ownerId,
            isDefault: item.isDefault,
            updatedAt: now,
          })
        )
        .where(eq(localSavedItemTable.id, item.id));
      continue;
    }

    await db.insert(localSavedItemTable).values(trimStringFields(item));
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
