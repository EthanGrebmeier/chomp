import { describe, expect, it } from 'vitest';

import { ParseRecipeUrlResponse } from '../../api/types';
import {
  FALLBACK_INGREDIENT_CATEGORY,
  normalizeIngredientCategory,
  normalizeParsedRecipeCategories,
  toRecipeImportCategories,
} from '../recipe-import-categories';

const categories = [
  { value: 'produce', label: 'Fruit & Veg' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'spices', label: 'Spices' },
  { value: 'other', label: 'Other' },
];

describe('toRecipeImportCategories', () => {
  it('keeps only value and label, preserving order', () => {
    expect(
      toRecipeImportCategories([
        {
          value: 'spices',
          label: 'Spices',
          color: 'red',
          isBuiltIn: false,
          id: 'abc',
        } as never,
        { value: 'produce', label: 'Fruit & Veg' },
      ])
    ).toEqual([
      { value: 'spices', label: 'Spices' },
      { value: 'produce', label: 'Fruit & Veg' },
    ]);
  });
});

describe('normalizeIngredientCategory', () => {
  it('returns an exact value match', () => {
    expect(normalizeIngredientCategory('spices', categories)).toBe('spices');
  });

  it('matches values case-insensitively', () => {
    expect(normalizeIngredientCategory('DAIRY', categories)).toBe('dairy');
  });

  it('matches renamed labels', () => {
    expect(normalizeIngredientCategory(' fruit  & veg ', categories)).toBe(
      'produce'
    );
  });

  it('falls back when the category was not offered', () => {
    expect(normalizeIngredientCategory('pantry', categories)).toBe(
      FALLBACK_INGREDIENT_CATEGORY
    );
    expect(normalizeIngredientCategory(null, categories)).toBe(
      FALLBACK_INGREDIENT_CATEGORY
    );
  });
});

describe('normalizeParsedRecipeCategories', () => {
  it('normalizes every ingredient category', () => {
    const response: ParseRecipeUrlResponse = {
      sourceUrl: 'https://example.com',
      recipeName: 'Test',
      servings: null,
      ingredients: [
        {
          name: 'Cumin',
          quantity: 1,
          unit: 'tsp',
          notes: null,
          category: 'Spices',
        },
        {
          name: 'Flour',
          quantity: 2,
          unit: 'cup',
          notes: null,
          category: 'baking',
        },
      ],
    };

    expect(
      normalizeParsedRecipeCategories(response, categories).ingredients.map(
        ingredient => ingredient.category
      )
    ).toEqual(['spices', 'other']);
  });
});
