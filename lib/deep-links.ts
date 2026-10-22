const RECIPE_SHARE_PATH = /^\/?recipes\/share\/([^/?#]+)/;

/**
 * Maps public web links onto app routes when the paths differ.
 *
 * Recipe share links (`https://chompgrocery.com/recipes/share/:id`) open the
 * app as universal links, but the in-app screen lives at
 * `/recipes/import/:id`. Anything else is returned unchanged.
 */
export function rewriteIncomingPath(path: string): string {
  const recipeId = getSharedRecipeId(path);
  return recipeId ? `/recipes/import/${recipeId}` : path;
}

function getSharedRecipeId(path: string): string | null {
  let pathname = path;
  try {
    const url = new URL(path);
    // Custom-scheme URLs (chomp://recipes/share/:id) parse "recipes" as the host.
    pathname =
      url.protocol === 'http:' || url.protocol === 'https:'
        ? url.pathname
        : `${url.host}${url.pathname}`;
  } catch {
    // Not an absolute URL; treat it as a bare path.
  }

  return pathname.match(RECIPE_SHARE_PATH)?.[1] ?? null;
}
