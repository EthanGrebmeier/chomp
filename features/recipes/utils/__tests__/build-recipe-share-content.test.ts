import { describe, expect, it } from 'vitest';

import { buildRecipeShareContent } from '../build-recipe-share-content';

const url = 'https://chompgrocery.com/recipes/share/recipe-123';

describe('buildRecipeShareContent', () => {
  it('names the recipe and its ingredient count, with the link as a separate item on iOS', () => {
    const content = buildRecipeShareContent(
      { name: 'Chicken Tikka Masala', recipe_ingredients: [{}, {}, {}] },
      url,
      'ios'
    );

    expect(content).toEqual({
      title: 'Chicken Tikka Masala',
      message:
        'Check out my recipe for Chicken Tikka Masala (3 ingredients) on Chomp. Open the link to save it to your recipes and add the ingredients to your grocery list.',
      url,
    });
  });

  it('puts the link in the message on Android, which ignores url', () => {
    const content = buildRecipeShareContent(
      { name: 'Toast', recipe_ingredients: [{}] },
      url,
      'android'
    );

    expect(content.url).toBeUndefined();
    expect(content.message).toContain('Toast (1 ingredient)');
    expect(content.message.endsWith(`\n\n${url}`)).toBe(true);
  });

  it('omits the ingredient count when there are none', () => {
    const content = buildRecipeShareContent(
      { name: 'Mystery', recipe_ingredients: [] },
      url,
      'ios'
    );

    expect(content.message).toContain('recipe for Mystery on Chomp');
  });
});
