import { transactLocally } from '@/lib/instant/local-transaction';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export const useUpdateGroceryListName = () => {
  const updateGroceryListName = async (listId: string, name: string) => {
    if (!name.trim()) {
      throw new Error('List name cannot be empty');
    }

    await transactLocally([
      db.tx.grocery_lists[listId].update(
        trimStringFields({
          name: name.trim(),
          updatedAt: new Date().toISOString(),
        })
      ),
    ]);
  };

  return updateGroceryListName;
};
