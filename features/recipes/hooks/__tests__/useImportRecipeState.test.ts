import { describe, expect, it } from 'vitest';

import { ParsedIngredient, ParseRecipeUrlResponse } from '../../api/types';
import { ImportState } from '../../types/import-state';
import { importReducer } from '../useImportRecipeState';

// Test fixtures
const mockIngredient1: ParsedIngredient = {
  name: 'flour',
  quantity: 2,
  unit: 'cups',
  notes: null,
  category: 'bakery',
};

const mockIngredient2: ParsedIngredient = {
  name: 'sugar',
  quantity: 1,
  unit: 'cup',
  notes: 'white sugar',
  category: 'bakery',
};

const mockIngredient3: ParsedIngredient = {
  name: 'eggs',
  quantity: 3,
  unit: 'each',
  notes: null,
  category: 'dairy',
};

const mockParseResponse: ParseRecipeUrlResponse = {
  sourceUrl: 'https://example.com/recipe',
  recipeName: 'Test Recipe',
  servings: '4',
  ingredients: [mockIngredient1, mockIngredient2, mockIngredient3],
};

function createPreviewState(
  ingredients: ParsedIngredient[] = mockParseResponse.ingredients
): ImportState {
  return {
    status: 'preview',
    data: mockParseResponse,
    editedName: mockParseResponse.recipeName ?? '',
    selectedIngredients: [...ingredients],
  };
}

describe('importReducer', () => {
  describe('UPDATE_INGREDIENT action', () => {
    it('updates the first ingredient correctly', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient1,
        quantity: 3,
        unit: 'tablespoons',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: updatedIngredient,
      });

      expect(newState.status).toBe('preview');
      if (newState.status === 'preview') {
        expect(newState.selectedIngredients[0]).toEqual(updatedIngredient);
        // Other ingredients should be unchanged
        expect(newState.selectedIngredients[1]).toEqual(mockIngredient2);
        expect(newState.selectedIngredients[2]).toEqual(mockIngredient3);
      }
    });

    it('updates a middle ingredient correctly', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient2,
        name: 'brown sugar',
        notes: 'packed',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 1,
        ingredient: updatedIngredient,
      });

      if (newState.status === 'preview') {
        expect(newState.selectedIngredients[1]).toEqual(updatedIngredient);
        // Other ingredients should be unchanged
        expect(newState.selectedIngredients[0]).toEqual(mockIngredient1);
        expect(newState.selectedIngredients[2]).toEqual(mockIngredient3);
      }
    });

    it('does not crash with negative index', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient1,
        name: 'should not apply',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: -1,
        ingredient: updatedIngredient,
      });

      // State should be unchanged
      expect(newState).toBe(state);
    });

    it('does not crash with out of bounds index', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient1,
        name: 'should not apply',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 999,
        ingredient: updatedIngredient,
      });

      // State should be unchanged
      expect(newState).toBe(state);
    });

    it('only changes state when in preview status', () => {
      const idleState: ImportState = { status: 'idle' };
      const loadingState: ImportState = { status: 'loading' };
      const savingState: ImportState = { status: 'saving' };

      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient1,
        name: 'should not apply',
      };

      const action: ImportAction = {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: updatedIngredient,
      };

      // None of these should change
      expect(importReducer(idleState, action)).toBe(idleState);
      expect(importReducer(loadingState, action)).toBe(loadingState);
      expect(importReducer(savingState, action)).toBe(savingState);
    });

    it('preserves other ingredients unchanged when updating one', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        name: 'all-purpose flour',
        quantity: 2.5,
        unit: 'cups',
        notes: 'sifted',
        category: 'bakery',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: updatedIngredient,
      });

      if (newState.status === 'preview') {
        expect(newState.selectedIngredients.length).toBe(3);
        expect(newState.selectedIngredients[0]).toEqual(updatedIngredient);
        expect(newState.selectedIngredients[1]).toEqual(mockIngredient2);
        expect(newState.selectedIngredients[2]).toEqual(mockIngredient3);
      }
    });

    it('is idempotent when updating with same data', () => {
      const state = createPreviewState();

      // First update
      const newState1 = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: mockIngredient1,
      });

      // Second update with same data
      const newState2 = importReducer(newState1, {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: mockIngredient1,
      });

      if (newState2.status === 'preview') {
        expect(newState2.selectedIngredients[0]).toEqual(mockIngredient1);
      }
    });

    it('creates a new array reference (state immutability)', () => {
      const state = createPreviewState();
      const originalArray =
        state.status === 'preview' ? state.selectedIngredients : [];

      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient1,
        name: 'updated flour',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 0,
        ingredient: updatedIngredient,
      });

      if (newState.status === 'preview') {
        // Should be a new array reference
        expect(newState.selectedIngredients).not.toBe(originalArray);
        // Original array should be unchanged
        expect(originalArray[0]).toEqual(mockIngredient1);
      }
    });

    it('updates the last ingredient correctly', () => {
      const state = createPreviewState();
      const updatedIngredient: ParsedIngredient = {
        ...mockIngredient3,
        quantity: 6,
        notes: 'large eggs',
      };

      const newState = importReducer(state, {
        type: 'UPDATE_INGREDIENT',
        index: 2,
        ingredient: updatedIngredient,
      });

      if (newState.status === 'preview') {
        expect(newState.selectedIngredients[2]).toEqual(updatedIngredient);
        // Other ingredients should be unchanged
        expect(newState.selectedIngredients[0]).toEqual(mockIngredient1);
        expect(newState.selectedIngredients[1]).toEqual(mockIngredient2);
      }
    });
  });
});
