import { generateId } from '@/lib/utils';

import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../../shared/types';

type CreateSeparateListItemArgs = {
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
  category?: string | null;
  recipeId?: string | null;
};

export const createSeparateListItem = async ({
  name,
  quantity,
  unit,
  notes,
  category,
  recipeId,
}: CreateSeparateListItemArgs) => {
  const now = new Date().toISOString();
  const groceryListItem = {
    id: generateId(),
    name,
    quantity,
    unit,
    notes,
    category,
    recipeId,
    isChecked: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(groceryListItemTable).values(groceryListItem);

  return groceryListItem;
};

