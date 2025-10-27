import { eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../../shared/types';

export const updateListItem = async ({
  itemId,
  updates,
}: {
  itemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
    category?: string | null;
  };
}) => {
  const processedUpdates = {
    ...updates,
    category: updates.category === undefined ? null : updates.category,
    updatedAt: new Date().toISOString(),
  };

  const result = await db
    .update(groceryListItemTable)
    .set(processedUpdates)
    .where(eq(groceryListItemTable.id, itemId))
    .returning();

  return result[0];
};
