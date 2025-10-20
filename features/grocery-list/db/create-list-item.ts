import { generateId } from '@/lib/utils';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
import { QuantityUnit } from '../../shared/types';

type CreateListItemArgs = {
  groceryListId: string;
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
};

export const createListItem = async ({
  groceryListId,
  name,
  quantity,
  unit,
  notes,
}: CreateListItemArgs) => {
  // Find or create the item
  const item = await findOrCreateItem({
    name,
    quantity,
    unit,
    notes,
  });

  // Create the grocery list item reference
  const groceryListItem = {
    id: generateId(),
    groceryListId,
    itemId: item.id,
    isChecked: false,
  };

  await db.insert(groceryListItemTable).values(groceryListItem);

  return groceryListItem;
};
