import { eq, sql } from 'drizzle-orm';

import { localSavedItemTable } from '../../../db/schema';
import { generateId } from '../../../lib/utils';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { db } from '../../../providers/migration-provider';
import { BaseSavedItem } from '../types';

type UpsertLocalSavedItemArgs = {
  item: BaseSavedItem;
  selectedLocalSavedItemId?: string;
  matchName?: string;
};

export const upsertLocalSavedItem = async ({
  item,
  selectedLocalSavedItemId,
  matchName,
}: UpsertLocalSavedItemArgs) => {
  const now = new Date().toISOString();
  const updatePayload = trimStringFields({
    name: item.name,
    category: item.category ?? null,
    notes: item.notes ?? null,
    storeId: item.storeId ?? null,
    updatedAt: now,
  });

  if (selectedLocalSavedItemId) {
    await db
      .update(localSavedItemTable)
      .set(updatePayload)
      .where(eq(localSavedItemTable.id, selectedLocalSavedItemId));
    return;
  }

  const nameToMatch = (matchName ?? item.name).trim().toLowerCase();
  const existing = await db
    .select({ id: localSavedItemTable.id })
    .from(localSavedItemTable)
    .where(sql`lower(${localSavedItemTable.name}) = ${nameToMatch}`)
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(localSavedItemTable)
      .set(updatePayload)
      .where(eq(localSavedItemTable.id, existing[0].id));
    return;
  }

  await db.insert(localSavedItemTable).values(
    trimStringFields({
      id: `local-user-${generateId()}`,
      name: item.name,
      category: item.category ?? null,
      notes: item.notes ?? null,
      storeId: item.storeId ?? null,
      createdAt: now,
      updatedAt: now,
    })
  );
};
