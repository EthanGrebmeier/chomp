type ShareableRecipe = {
  name: string;
  recipe_ingredients: readonly unknown[];
};

export type RecipeShareContent = {
  title: string;
  message: string;
  url?: string;
};

/**
 * Builds the text sent with a recipe share link so the recipient knows what
 * they're opening before they tap it.
 *
 * iOS shares `message` and `url` as separate items (text plus a rich link
 * preview), so the link stays out of the message there. Android ignores
 * `url`, so the link is appended to the message instead.
 */
export function buildRecipeShareContent(
  recipe: ShareableRecipe,
  shareUrl: string,
  platform: 'ios' | 'android' | (string & {})
): RecipeShareContent {
  const name = recipe.name.trim() || 'a recipe';
  const ingredientCount = recipe.recipe_ingredients.length;
  const ingredientSummary =
    ingredientCount > 0
      ? ` (${ingredientCount} ${ingredientCount === 1 ? 'ingredient' : 'ingredients'})`
      : '';
  const text = `Check out my recipe for ${name}${ingredientSummary} on Chomp. Open the link to save it to your recipes and add the ingredients to your grocery list.`;

  if (platform === 'ios') {
    return { title: name, message: text, url: shareUrl };
  }

  return { title: name, message: `${text}\n\n${shareUrl}` };
}
