import { eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const updateListItem = async ({
  itemId,
  updates,
}: {
  itemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: 'each' | 'kg' | 'g' | 'l' | 'ml' | 'lb';
  };
}) => {
  const result = await db
    .update(groceryListItemTable)
    .set(updates)
    .where(eq(groceryListItemTable.id, itemId))
    .returning();

  return result[0];
};
