import { eq } from 'drizzle-orm';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const getItem = async (itemId: string) => {
  const result = await db
    .select()
    .from(itemTable)
    .where(eq(itemTable.id, itemId))
    .limit(1);

  return result[0];
};
