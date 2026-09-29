import { describe, expect, it } from 'vitest';

import {
  buildMealPlanLinkSentence,
  buildRecipeLinkSentence,
  resolveGroceryItemMealPlanLink,
} from '../meal-plan-link';

const recipe = { id: 'recipe-1', name: 'Chili' };

describe('resolveGroceryItemMealPlanLink', () => {
  it('links a snapshot-sourced item to its planned recipe and date', () => {
    expect(
      resolveGroceryItemMealPlanLink({
        recipe,
        meal_plan_ingredient_snapshot: {
          meal_plan_recipe: { date: '2026-09-07', recipe },
        },
      })
    ).toEqual({
      kind: 'recipe',
      recipeId: 'recipe-1',
      recipeName: 'Chili',
      date: '2026-09-07',
    });
  });

  it("falls back to the item's recipe when the planned recipe isn't loaded", () => {
    expect(
      resolveGroceryItemMealPlanLink({
        recipe,
        meal_plan_ingredient_snapshot: {
          meal_plan_recipe: { date: '2026-09-07' },
        },
      })
    ).toMatchObject({ kind: 'recipe', recipeName: 'Chili' });
  });

  it('links a standalone meal plan item to its date', () => {
    expect(
      resolveGroceryItemMealPlanLink({
        meal_plan_item: { date: '2026-09-08' },
      })
    ).toEqual({ kind: 'item', date: '2026-09-08' });
  });

  it('returns null for a recipe item whose meal plan entry was deleted', () => {
    expect(
      resolveGroceryItemMealPlanLink({
        recipe,
        meal_plan_ingredient_snapshot: null,
        meal_plan_item: null,
      })
    ).toBeNull();
  });

  it('returns null for a missing item', () => {
    expect(resolveGroceryItemMealPlanLink(undefined)).toBeNull();
  });
});

describe('buildMealPlanLinkSentence', () => {
  it('formats a recipe source as "An ingredient of {recipe} for {date}"', () => {
    expect(
      buildMealPlanLinkSentence({
        kind: 'recipe',
        recipeId: 'recipe-1',
        recipeName: 'Chili',
        date: '2026-09-07',
      })
    ).toEqual([
      { type: 'text', text: 'An ingredient of ' },
      { type: 'recipe', text: 'Chili', recipeId: 'recipe-1' },
      { type: 'text', text: ' for ' },
      { type: 'date', text: 'Sep 7', date: '2026-09-07' },
    ]);
  });

  it('formats a standalone item as "Planned for {date}"', () => {
    expect(
      buildMealPlanLinkSentence({ kind: 'item', date: '2027-01-01' })
    ).toEqual([
      { type: 'text', text: 'Planned for ' },
      { type: 'date', text: 'Jan 1', date: '2027-01-01' },
    ]);
  });
});

describe('buildRecipeLinkSentence', () => {
  it('formats a plain recipe source as "An ingredient of {recipe}"', () => {
    expect(buildRecipeLinkSentence(recipe)).toEqual([
      { type: 'text', text: 'An ingredient of ' },
      { type: 'recipe', text: 'Chili', recipeId: 'recipe-1' },
    ]);
  });
});
