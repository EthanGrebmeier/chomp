import { db } from '../../../lib/instant';

export type LinkStoreToIngredientArgs = {
  ingredientId: string;
  storeId?: string;
  currentStoreId?: string;
};

export const linkStoreToIngredient = async ({
  ingredientId,
  storeId,
  currentStoreId,
}: LinkStoreToIngredientArgs) => {
  const transactions = [];

  // If storeId is undefined and we have a current store, unlink it
  if (storeId === undefined && currentStoreId) {
    transactions.push(
      db.tx.recipe_ingredients[ingredientId].unlink({
        store: currentStoreId,
      })
    );
  }
  // If storeId is different from current, handle the change
  else if (storeId !== currentStoreId) {
    // Unlink current store if it exists
    if (currentStoreId) {
      transactions.push(
        db.tx.recipe_ingredients[ingredientId].unlink({
          store: currentStoreId,
        })
      );
    }
    // Link new store if provided
    if (storeId) {
      transactions.push(
        db.tx.recipe_ingredients[ingredientId].link({
          store: storeId,
        })
      );
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};

