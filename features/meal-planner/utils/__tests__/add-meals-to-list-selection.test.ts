import { describe, expect, it } from 'vitest';

import { getAddMealsToListSelection } from '../add-meals-to-list-selection';

describe('getAddMealsToListSelection', () => {
  it('selects every meal by default', () => {
    expect(
      getAddMealsToListSelection({
        recipeIds: ['recipe-1', 'recipe-2'],
        itemIds: ['item-1'],
        deselectedIds: new Set(),
      })
    ).toEqual({
      selectedRecipeIds: ['recipe-1', 'recipe-2'],
      skippedRecipeIds: [],
      selectedItemIds: ['item-1'],
      skippedItemIds: [],
    });
  });

  it('partitions deselected recipes and items into skipped IDs', () => {
    expect(
      getAddMealsToListSelection({
        recipeIds: ['recipe-1', 'recipe-2'],
        itemIds: ['item-1', 'item-2'],
        deselectedIds: new Set(['recipe-2', 'item-1']),
      })
    ).toEqual({
      selectedRecipeIds: ['recipe-1'],
      skippedRecipeIds: ['recipe-2'],
      selectedItemIds: ['item-2'],
      skippedItemIds: ['item-1'],
    });
  });
});
