import { describe, expect, it } from 'vitest';

import { validateRecipeUrl } from '../validate-recipe-url';

describe('validateRecipeUrl', () => {
  it('accepts valid https URL', () => {
    const result = validateRecipeUrl('https://example.com/recipe');
    expect(result).toEqual({ valid: true, url: 'https://example.com/recipe' });
  });

  it('accepts valid http URL', () => {
    const result = validateRecipeUrl('http://example.com/recipe');
    expect(result).toEqual({ valid: true, url: 'http://example.com/recipe' });
  });

  it('rejects URL with missing protocol', () => {
    const result = validateRecipeUrl('example.com/recipe');
    expect(result).toEqual({ valid: false, error: 'Please enter a valid URL' });
  });

  it('rejects invalid URL format', () => {
    const result = validateRecipeUrl('not a url at all');
    expect(result).toEqual({ valid: false, error: 'Please enter a valid URL' });
  });

  it('rejects empty string', () => {
    const result = validateRecipeUrl('');
    expect(result).toEqual({ valid: false, error: 'Please enter a URL' });
  });

  it('trims whitespace from input', () => {
    const result = validateRecipeUrl('  https://example.com/recipe  ');
    expect(result).toEqual({
      valid: true,
      url: 'https://example.com/recipe',
    });
  });

  it('rejects whitespace-only input', () => {
    const result = validateRecipeUrl('   ');
    expect(result).toEqual({ valid: false, error: 'Please enter a URL' });
  });

  it('rejects non-http protocols', () => {
    const result = validateRecipeUrl('ftp://example.com/recipe');
    expect(result).toEqual({
      valid: false,
      error: 'URL must start with http:// or https://',
    });
  });

  it('rejects javascript protocol', () => {
    const result = validateRecipeUrl('javascript:alert(1)');
    expect(result).toEqual({
      valid: false,
      error: 'URL must start with http:// or https://',
    });
  });
});
