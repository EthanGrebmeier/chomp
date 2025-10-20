import { generateId } from '@/lib/utils';
import { itemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';

export type CreateItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
  category?: string | null;
};

export const createItem = async ({
  name,
  quantity,
  unit,
  notes,
  category,
}: CreateItemArgs) => {
  const itemId = generateId();
  const now = new Date().toISOString();

  const newItem = {
    id: itemId,
    name,
    quantity,
    unit,
    notes,
    category,
    createdAt: now,
  };

  await db.insert(itemTable).values(newItem);

  return newItem;
};
