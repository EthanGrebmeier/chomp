import { eq } from 'drizzle-orm';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const deleteItem = async (itemId: string) => {
  await db.delete(itemTable).where(eq(itemTable.id, itemId));

  return { itemId };
};
