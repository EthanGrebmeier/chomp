import { and, eq } from 'drizzle-orm';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';
import { createItem } from './create-item';

export type FindOrCreateItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
};

export const findOrCreateItem = async ({
  name,
  quantity,
  unit,
  notes,
}: FindOrCreateItemArgs) => {
  // Try to find an existing item with the same name, quantity, and unit
  const existingItem = await db
    .select()
    .from(itemTable)
    .where(
      and(
        eq(itemTable.name, name),
        eq(itemTable.quantity, quantity),
        eq(itemTable.unit, unit)
      )
    )
    .limit(1);

  if (existingItem.length > 0) {
    return existingItem[0];
  }

  // Create a new item if none exists
  return await createItem({ name, quantity, unit, notes });
};
