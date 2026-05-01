import { describe, expect, it } from 'vitest';

import { ParsedIngredient, ParseRecipeUrlResponse } from '../../api/types';
import { transformParsedRecipe } from '../transform-parsed-recipe';

describe('transformParsedRecipe', () => {
  const mockResponse: ParseRecipeUrlResponse = {
    sourceUrl: 'https://example.com/recipe',
    recipeName: 'Test Recipe',
    servings: '4 servings',
    ingredients: [
      { name: 'flour', quantity: 2, unit: 'cups', notes: 'sifted', category: 'other' },
      { name: 'sugar', quantity: 1, unit: 'cup', notes: null, category: 'other' },
    ],
  };

  it('transforms full data correctly', () => {
    const result = transformParsedRecipe(
      mockResponse,
      'My Edited Name',
      mockResponse.ingredients
    );

    expect(result).toEqual({
      recipe: {
        name: 'My Edited Name',
        description: '',
        sourceUrl: 'https://example.com/recipe',
        servings: '4 servings',
      },
      ingredients: [
        { name: 'flour', quantity: 2, unit: 'cups', notes: 'sifted', category: 'other' },
        { name: 'sugar', quantity: 1, unit: 'cup', notes: undefined, category: 'other' },
      ],
    });
  });

  it('uses edited name over parsed name', () => {
    const result = transformParsedRecipe(
      mockResponse,
      'Custom Name',
      mockResponse.ingredients
    );

    expect(result.recipe.name).toBe('Custom Name');
  });

  it('falls back to parsed name when edited name is empty', () => {
    const result = transformParsedRecipe(mockResponse, '', mockResponse.ingredients);

    expect(result.recipe.name).toBe('Test Recipe');
  });

  it('falls back to "Imported Recipe" when both names are empty', () => {
    const responseWithoutName: ParseRecipeUrlResponse = {
      ...mockResponse,
      recipeName: null,
    };

    const result = transformParsedRecipe(responseWithoutName, '', mockResponse.ingredients);

    expect(result.recipe.name).toBe('Imported Recipe');
  });

  it('defaults null quantity to 1', () => {
    const ingredientsWithNullQuantity: ParsedIngredient[] = [
      { name: 'salt', quantity: null, unit: 'pinch', notes: null, category: 'other' },
    ];

    const result = transformParsedRecipe(
      mockResponse,
      'Test',
      ingredientsWithNullQuantity
    );

    expect(result.ingredients[0].quantity).toBe(1);
  });

  it('defaults null unit to empty string', () => {
    const ingredientsWithNullUnit: ParsedIngredient[] = [
      { name: 'egg', quantity: 2, unit: null, notes: null, category: 'dairy' },
    ];

    const result = transformParsedRecipe(mockResponse, 'Test', ingredientsWithNullUnit);

    expect(result.ingredients[0].unit).toBe('');
  });

  it('only includes selected ingredients', () => {
    const selectedIngredients = [mockResponse.ingredients[0]];

    const result = transformParsedRecipe(mockResponse, 'Test', selectedIngredients);

    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].name).toBe('flour');
  });

  it('passes through category from API', () => {
    const ingredientsWithCategory: ParsedIngredient[] = [
      { name: 'chicken', quantity: 1, unit: 'lb', notes: null, category: 'proteins' },
    ];

    const result = transformParsedRecipe(mockResponse, 'Test', ingredientsWithCategory);

    expect(result.ingredients[0].category).toBe('proteins');
  });

  it('handles null servings', () => {
    const responseWithoutServings: ParseRecipeUrlResponse = {
      ...mockResponse,
      servings: null,
    };

    const result = transformParsedRecipe(
      responseWithoutServings,
      'Test',
      mockResponse.ingredients
    );

    expect(result.recipe.servings).toBeUndefined();
  });

  it('handles empty ingredients array', () => {
    const result = transformParsedRecipe(mockResponse, 'Test', []);

    expect(result.ingredients).toEqual([]);
  });
});
