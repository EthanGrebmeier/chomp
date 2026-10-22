import { describe, expect, it } from 'vitest';

import { rewriteIncomingPath } from '../deep-links';

describe('rewriteIncomingPath', () => {
  it.each([
    'https://chompgrocery.com/recipes/share/recipe-123',
    'https://chompgrocery.com/recipes/share/recipe-123?utm=sms',
    'chomp://recipes/share/recipe-123',
    '/recipes/share/recipe-123',
  ])('routes recipe share link %s to the import screen', path => {
    expect(rewriteIncomingPath(path)).toBe('/recipes/import/recipe-123');
  });

  it.each([
    'https://chompgrocery.com/join-list/ABC123',
    'chomp://recipes/import/recipe-123',
    '/recipes/recipe-123',
  ])('leaves %s unchanged', path => {
    expect(rewriteIncomingPath(path)).toBe(path);
  });
});
