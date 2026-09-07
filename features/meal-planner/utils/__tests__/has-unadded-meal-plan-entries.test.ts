import { describe, expect, it } from 'vitest';

import { hasUnaddedMealPlanEntries } from '../has-unadded-meal-plan-entries';

describe('hasUnaddedMealPlanEntries', () => {
  it('is false when there are no unadded recipes or items', () => {
    expect(hasUnaddedMealPlanEntries({ recipes: [], items: [] })).toBe(false);
  });

  it('is true when an unadded meal plan item exists', () => {
    expect(
      hasUnaddedMealPlanEntries({ recipes: [], items: [{ id: 'item-1' }] })
    ).toBe(true);
  });

  it('is true when an unadded meal plan recipe still points at a recipe', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [{ id: 'mpr-1', recipe: { id: 'recipe-1' } }],
        items: [],
      })
    ).toBe(true);
  });

  it('ignores meal plan recipes whose recipe no longer exists', () => {
    expect(
      hasUnaddedMealPlanEntries({
        recipes: [{ id: 'mpr-orphan', recipe: undefined }],
        items: [],
      })
    ).toBe(false);
  });
});
