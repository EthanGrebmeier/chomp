import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export const deleteRecipe = async (recipeId: string) => {
  await db.transact([tx.recipes[recipeId].delete()]);
};
