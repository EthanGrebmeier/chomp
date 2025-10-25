import { and, eq, notInArray } from 'drizzle-orm';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';
import { createItem } from './create-item';

export type FindOrCreateItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
  category?: string | null;
  excludeItemIds?: string[];
};

export const findOrCreateItem = async ({
  name,
  quantity,
  unit,
  notes,
  category,
  excludeItemIds,
}: FindOrCreateItemArgs) => {
  // Build the where conditions
  const whereConditions = [
    eq(itemTable.name, name),
    eq(itemTable.quantity, quantity),
    eq(itemTable.unit, unit),
  ];

  // Add exclusion condition if provided
  if (excludeItemIds && excludeItemIds.length > 0) {
    whereConditions.push(notInArray(itemTable.id, excludeItemIds));
  }

  // Try to find an existing item with the same name, quantity, and unit
  const existingItem = await db
    .select()
    .from(itemTable)
    .where(and(...whereConditions))
    .limit(1);

  if (existingItem.length > 0) {
    return existingItem[0];
  }

  // Create a new item if none exists
  return await createItem({ name, quantity, unit, notes, category });
};
