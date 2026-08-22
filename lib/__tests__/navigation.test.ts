import { afterEach, describe, expect, it } from 'vitest';

import {
  buildEditRecipeUrl,
  buildGroceryListsIndexUrl,
  buildListUrl,
  buildListURL,
  buildMealPlanUrl,
  navigation,
} from '../navigation';

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

describe('buildListURL', () => {
  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('uses the public app URL when the API URL is not configured', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(buildListURL('ABC123')).toBe(
      'https://chompgrocery.com/join-list/ABC123'
    );
  });

  it('uses the configured API URL without duplicating slashes', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';

    expect(buildListURL('ABC123')).toBe(
      'https://api.example.com/join-list/ABC123'
    );
  });
});

describe('buildEditRecipeUrl', () => {
  it('builds an edit route without a list context', () => {
    expect(buildEditRecipeUrl({ recipeId: 'recipe-123' })).toEqual({
      pathname: '/recipes/edit/[recipeId]',
      params: { recipeId: 'recipe-123' },
    });
  });

  it('preserves the list context', () => {
    expect(
      buildEditRecipeUrl({
        recipeId: 'recipe-123',
        listId: 'list-456',
      })
    ).toEqual({
      pathname: '/recipes/edit/[recipeId]',
      params: {
        recipeId: 'recipe-123',
        listId: 'list-456',
      },
    });
  });
});

describe('list workspace navigation', () => {
  it('builds the grocery lists index URL with the active workspace context', () => {
    expect(
      buildGroceryListsIndexUrl({
        selectedListId: 'list-456',
      })
    ).toBe('/grocery-lists?selectedListId=list-456');
  });

  it('builds the grocery lists index URL without optional context', () => {
    expect(buildGroceryListsIndexUrl()).toBe('/grocery-lists');
  });

  it('builds the default grocery list URL without a view parameter', () => {
    expect(buildListUrl({ listId: 'list-456' })).toBe(
      '/(tabs)?listId=list-456'
    );
  });

  it('builds a deep link to the inline meal plan view', () => {
    expect(buildMealPlanUrl({ listId: 'list-456' })).toBe(
      '/(tabs)?listId=list-456&view=meal-plan'
    );
  });

  it('routes existing meal-plan navigation calls to the inline view', () => {
    expect(navigation.goToMealPlan('list-456')).toBe(
      '/(tabs)?listId=list-456&view=meal-plan'
    );
  });
});
