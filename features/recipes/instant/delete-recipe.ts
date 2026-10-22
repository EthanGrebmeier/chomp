/**
 * Deletes a recipe and, in the same transaction, the planned meals that use
 * it on lists the owner is a member of, with their unchecked linked grocery
 * items. Checked linked items stay on the list as plain items.
 *
 * The planned meals are loaded first; if that fails (e.g. offline) the delete
 * fails too rather than leaving recipe-less planned meals behind.
 */
export const deleteRecipe = async (recipeId: string) => {
  const { deleteQuantityRecipe } =
    await import('@/features/quantity/app/recipe-actions');
  return deleteQuantityRecipe(recipeId);
};
