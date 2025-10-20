import { eq } from 'drizzle-orm';
import {
  itemTable,
  recipeIngredientTable,
  recipeTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { RecipeWithIngredients } from '../types';

export const getRecipe = async (
  recipeId: string
): Promise<RecipeWithIngredients | null> => {
  const recipe = await db
    .select()
    .from(recipeTable)
    .where(eq(recipeTable.id, recipeId))
    .limit(1);

  if (recipe.length === 0) {
    return null;
  }

  const ingredients = await db
    .select({
      ingredient: recipeIngredientTable,
      item: itemTable,
    })
    .from(recipeIngredientTable)
    .leftJoin(itemTable, eq(recipeIngredientTable.itemId, itemTable.id))
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  const ingredientsWithItems = ingredients.map(({ ingredient, item }) => ({
    ...ingredient,
    item: item!,
  }));

  return {
    ...recipe[0],
    ingredients: ingredientsWithItems,
  };
};
