import { addDays, format, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { hasUnaddedMealPlanEntries } from '../has-unadded-meal-plan-entries';
import { MEAL_PLAN_ADDABLE_PAST_DAYS } from '../meal-plan-addable-window';

const today = format(new Date(), 'yyyy-MM-dd');
const staleDate = format(
  subDays(new Date(), MEAL_PLAN_ADDABLE_PAST_DAYS + 1),
  'yyyy-MM-dd'
);
const futureDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

describe('hasUnaddedMealPlanEntries', () => {
  it('is false when there are no unadded recipes or items', () => {
    expect(hasUnaddedMealPlanEntries({ recipes: [], items: [] })).toBe(false);
  });

  it('is true when an unadded meal plan item exists', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [],
        items: [{ id: 'item-1', date: today }],
      })
    ).toBe(true);
  });

  it('is true when an unadded meal plan recipe still points at a recipe', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [{ id: 'mpr-1', date: futureDate, recipe: { id: 'recipe-1' } }],
        items: [],
      })
    ).toBe(true);
  });

  it('ignores meal plan recipes whose recipe no longer exists', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [{ id: 'mpr-orphan', date: today, recipe: undefined }],
        items: [],
      })
    ).toBe(false);
  });

  it('disregards meals older than the addable window', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [
          { id: 'mpr-stale', date: staleDate, recipe: { id: 'recipe-1' } },
        ],
        items: [{ id: 'item-stale', date: staleDate }],
      })
    ).toBe(false);
  });
});
