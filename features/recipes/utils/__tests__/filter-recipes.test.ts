import { describe, expect, it } from 'vitest';

import { RecipeWithIngredients } from '../../types';
import { filterRecipes } from '../filter-recipes';

const buildRecipe = (
  overrides: Partial<RecipeWithIngredients>
): RecipeWithIngredients => ({
  id: `recipe-${Math.random().toString(36).slice(2, 8)}`,
  name: 'Sample Recipe',
  description: 'Tasty and quick meal.',
  imageSrc: '',
  visibility: 'private',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  mealTag: undefined,
  recipe_ingredients: [],
  ...overrides,
});

const buildIngredient = (name: string) => ({
  id: `ingredient-${Math.random().toString(36).slice(2, 8)}`,
  name,
  quantity: 1,
  unit: '',
  notes: undefined,
  category: undefined,
});

describe('filterRecipes', () => {
  it('returns all recipes when no filters are provided', () => {
    const recipes = [
      buildRecipe({ name: 'Pasta' }),
      buildRecipe({ name: 'Soup' }),
    ];

    expect(filterRecipes(recipes)).toHaveLength(2);
  });

  it('matches search across name, description, and ingredient names', () => {
    const recipes = [
      buildRecipe({ name: 'Garlic Pasta' }),
      buildRecipe({
        name: 'Salad',
        description: 'Fresh greens with lemon.',
      }),
      buildRecipe({
        name: 'Roast Chicken',
        recipe_ingredients: [buildIngredient('Rosemary')],
      }),
    ];

    expect(filterRecipes(recipes, { search: 'garlic' })).toHaveLength(1);
    expect(filterRecipes(recipes, { search: 'lemon' })).toHaveLength(1);
    expect(filterRecipes(recipes, { search: 'rosemary' })).toHaveLength(1);
  });

  it('filters by meal tag and ignores the All option', () => {
    const recipes = [
      buildRecipe({ name: 'Omelet', mealTag: 'Breakfast' }),
      buildRecipe({ name: 'Pizza', mealTag: 'Dinner' }),
    ];

    expect(filterRecipes(recipes, { mealTag: 'Breakfast' })).toHaveLength(1);
    expect(filterRecipes(recipes, { mealTag: 'All' })).toHaveLength(2);
  });

  it('combines search and meal tag filters', () => {
    const recipes = [
      buildRecipe({
        name: 'Protein Pancakes',
        mealTag: 'Breakfast',
        recipe_ingredients: [buildIngredient('Banana')],
      }),
      buildRecipe({
        name: 'Banana Bread',
        mealTag: 'Dessert',
        recipe_ingredients: [buildIngredient('Banana')],
      }),
    ];

    const result = filterRecipes(recipes, {
      search: 'banana',
      mealTag: 'Breakfast',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Protein Pancakes');
  });

  it('sorts by name A-Z', () => {
    const recipes = [
      buildRecipe({ name: 'banana bread' }),
      buildRecipe({ name: 'Apple pie' }),
      buildRecipe({ name: 'carrot soup' }),
    ];

    const result = filterRecipes(recipes, { sortBy: 'name' });
    const names = result.map(recipe => recipe.name);

    expect(names).toEqual(['Apple pie', 'banana bread', 'carrot soup']);
  });

  it('sorts by recent updatedAt date', () => {
    const recipes = [
      buildRecipe({
        name: 'Old Recipe',
        updatedAt: '2023-01-01T00:00:00.000Z',
      }),
      buildRecipe({
        name: 'New Recipe',
        updatedAt: '2024-02-01T00:00:00.000Z',
      }),
    ];

    const result = filterRecipes(recipes, { sortBy: 'recent' });
    const names = result.map(recipe => recipe.name);

    expect(names).toEqual(['New Recipe', 'Old Recipe']);
  });
});
