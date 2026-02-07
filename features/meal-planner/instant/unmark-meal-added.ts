import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UnmarkMealAddedArgs = {
  type: 'recipe' | 'item';
  id: string;
};

export const unmarkMealAdded = async ({ type, id }: UnmarkMealAddedArgs) => {
  const now = new Date().toISOString();

  const entity =
    type === 'recipe' ? tx.meal_plan_recipes : tx.meal_plan_items;

  await db.transact(
    entity[id].update(
      trimStringFields({
        addedToList: false,
        addedToListAt: '',
        updatedAt: now,
      })
    )
  );
};
