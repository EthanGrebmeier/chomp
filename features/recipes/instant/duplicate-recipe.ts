import { id, tx } from '@instantdb/react-native';

import { transactLocally } from '@/lib/instant/local-transaction';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

import { RecipeIngredientInput } from './add-recipe-to-list';

export type DuplicateRecipeArgs = {
  name: string;
  description?: string;
  imageSrc?: string;
  visibility?: string;
  ingredients: RecipeIngredientInput[];
};

export const duplicateRecipe = async (recipe: DuplicateRecipeArgs) => {
  const user = await db.getAuth();
  if (!user) throw new Error('User not authenticated');
  const newRecipeId = id();
  const now = new Date().toISOString();

  const transactions = [
    tx.recipes[newRecipeId].update(
      trimStringFields({
        name: `${recipe.name} (Copy)`,
        description: recipe.description,
        imageSrc: recipe.imageSrc,
        visibility: recipe.visibility,
        createdAt: now,
        updatedAt: now,
      })
    ),
  ];

  transactions.push(tx.recipes[newRecipeId].link({ user: user.id }));

  // Duplicate ingredients
  for (const ingredient of recipe.ingredients) {
    const newIngredientId = id();
    transactions.push(
      tx.recipe_ingredients[newIngredientId].update(
        trimStringFields({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          category: ingredient.category,
        })
      ),
      tx.recipe_ingredients[newIngredientId].link({
        recipe: newRecipeId,
      })
    );
  }

  await transactLocally(transactions);

  return { id: newRecipeId };
};
