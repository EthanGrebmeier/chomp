import { generateId } from '@/lib/utils';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';

export type CreateItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
};

export const createItem = async ({
  name,
  quantity,
  unit,
  notes,
}: CreateItemArgs) => {
  const itemId = generateId();
  const now = new Date().toISOString();

  const newItem = {
    id: itemId,
    name,
    quantity,
    unit,
    notes,
    createdAt: now,
  };

  await db.insert(itemTable).values(newItem);

  return newItem;
};
