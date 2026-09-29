import { formatMealPlanDate } from '../meal-planner/utils/meal-plan-date-format';

/**
 * Where a linked grocery item came from on the meal plan: an ingredient of a
 * planned recipe, or a standalone planned item.
 */
export type GroceryItemMealPlanLink =
  | {
      kind: 'recipe';
      recipeId: string;
      recipeName: string;
      /** Meal plan date, `yyyy-MM-dd`. */
      date: string;
    }
  | {
      kind: 'item';
      /** Meal plan date, `yyyy-MM-dd`. */
      date: string;
    };

type LinkedRecipe = { id: string; name: string } | null | undefined;

/** The subset of a grocery item (with its meal plan links) the link reads. */
export type GroceryItemWithMealPlanSource = {
  recipe?: LinkedRecipe;
  meal_plan_ingredient_snapshot?: {
    meal_plan_recipe?: { date: string; recipe?: LinkedRecipe } | null;
  } | null;
  meal_plan_item?: { date: string } | null;
};

/**
 * Resolves a grocery item's meal plan link, or `null` when the item has none
 * (a normal item, or a checked item whose meal plan entry has since been
 * deleted). The recipe comes from the planned meal, falling back to the
 * item's own `recipe` link.
 */
export const resolveGroceryItemMealPlanLink = (
  item: GroceryItemWithMealPlanSource | null | undefined
): GroceryItemMealPlanLink | null => {
  if (!item) return null;

  const mealPlanRecipe = item.meal_plan_ingredient_snapshot?.meal_plan_recipe;
  if (mealPlanRecipe) {
    const recipe = mealPlanRecipe.recipe ?? item.recipe;
    if (!recipe) return null;
    return {
      kind: 'recipe',
      recipeId: recipe.id,
      recipeName: recipe.name,
      date: mealPlanRecipe.date,
    };
  }

  if (item.meal_plan_item) {
    return { kind: 'item', date: item.meal_plan_item.date };
  }

  return null;
};

export type MealPlanLinkSentencePart =
  | { type: 'text'; text: string }
  | { type: 'recipe'; text: string; recipeId: string }
  | { type: 'date'; text: string; date: string };

/**
 * Splits the link into sentence parts so the UI can make the recipe and date
 * tappable: "An ingredient of {recipe} for {date}" or "Planned for {date}".
 */
export const buildMealPlanLinkSentence = (
  link: GroceryItemMealPlanLink
): MealPlanLinkSentencePart[] => {
  const datePart: MealPlanLinkSentencePart = {
    type: 'date',
    text: formatMealPlanDate(link.date),
    date: link.date,
  };

  if (link.kind === 'recipe') {
    return [
      { type: 'text', text: 'An ingredient of ' },
      { type: 'recipe', text: link.recipeName, recipeId: link.recipeId },
      { type: 'text', text: ' for ' },
      datePart,
    ];
  }

  return [{ type: 'text', text: 'Planned for ' }, datePart];
};
