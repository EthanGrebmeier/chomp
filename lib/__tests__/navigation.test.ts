import { afterEach, describe, expect, it } from 'vitest';

import { buildEditRecipeUrl, buildListURL } from '../navigation';

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
