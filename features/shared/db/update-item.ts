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
    category?: string | null;
  };
};

export const updateItem = async ({ itemId, updates }: UpdateItemArgs) => {
  // Handle null category explicitly - convert undefined to null for database
  const processedUpdates = {
    ...updates,
    category: updates.category === undefined ? null : updates.category,
    updatedAt: new Date().toISOString(),
  };

  const result = await db
    .update(itemTable)
    .set(processedUpdates)
    .where(eq(itemTable.id, itemId))
    .returning();

  return result[0];
};
