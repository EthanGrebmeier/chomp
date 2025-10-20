import { eq } from 'drizzle-orm';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';

export type UpdateItemArgs = {
  itemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
    category?: string;
  };
};

export const updateItem = async ({ itemId, updates }: UpdateItemArgs) => {
  const result = await db
    .update(itemTable)
    .set(updates)
    .where(eq(itemTable.id, itemId))
    .returning();

  return result[0];
};
