import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../../../db/local';
import { localSavedItemTable } from '../../../db/schema';
import { db as instantDb } from '../../../lib/instant';
import { generateId } from '../../../lib/utils';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { BaseSavedItem } from '../types';

import { normalizeLocalSavedItemOwnerId } from './local-saved-item-scope';

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
  const auth = await instantDb.getAuth();
  const ownerId = normalizeLocalSavedItemOwnerId(auth?.id);
  const now = new Date().toISOString();
  const updatePayload = trimStringFields({
    name: item.name,
    category: item.category ?? null,
    notes: item.notes ?? null,
    storeId: item.storeId ?? null,
    updatedAt: now,
  });

  if (selectedLocalSavedItemId) {
    const selected = await db
      .select({
        ownerId: localSavedItemTable.ownerId,
        isDefault: localSavedItemTable.isDefault,
      })
      .from(localSavedItemTable)
      .where(eq(localSavedItemTable.id, selectedLocalSavedItemId))
      .limit(1);

    const canUpdateSelected =
      selected.length > 0 &&
      !selected[0].isDefault &&
      selected[0].ownerId === ownerId;

    if (canUpdateSelected) {
      await db
        .update(localSavedItemTable)
        .set(updatePayload)
        .where(eq(localSavedItemTable.id, selectedLocalSavedItemId));
      return;
    }
  }

  const nameToMatch = (matchName ?? item.name).trim().toLowerCase();
  const ownerPredicate = ownerId
    ? eq(localSavedItemTable.ownerId, ownerId)
    : isNull(localSavedItemTable.ownerId);
  const existing = await db
    .select({ id: localSavedItemTable.id })
    .from(localSavedItemTable)
    .where(
      and(
        eq(localSavedItemTable.isDefault, false),
        ownerPredicate,
        sql`lower(${localSavedItemTable.name}) = ${nameToMatch}`
      )
    )
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
      ownerId,
      isDefault: false,
      name: item.name,
      category: item.category ?? null,
      notes: item.notes ?? null,
      storeId: item.storeId ?? null,
      createdAt: now,
      updatedAt: now,
    })
  );
};
