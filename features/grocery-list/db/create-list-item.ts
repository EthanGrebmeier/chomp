import { generateId } from '@/lib/utils';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../../shared/types';

type CreateListItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
  category?: string | null;
};

export const createListItem = async ({
  name,
  quantity,
  unit,
  notes,
  category,
}: CreateListItemArgs) => {
  const now = new Date().toISOString();
  const groceryListItem = {
    id: generateId(),
    name,
    quantity,
    unit,
    notes,
    category,
    isChecked: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(groceryListItemTable).values(groceryListItem);

  return groceryListItem;
};
