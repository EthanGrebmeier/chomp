import { db } from '../../../lib/instant';

export const unlinkRecipeFromItem = async ({
  itemId,
  recipeId,
}: {
  itemId: string;
  recipeId: string;
}) => {
  await db.transact([
    db.tx.grocery_items[itemId].unlink({
      recipe: recipeId,
    }),
  ]);
};
