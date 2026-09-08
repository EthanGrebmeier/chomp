import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecipeBySourceId } from '../use-recipe-by-source-id';
import { useRecipes } from '../use-recipes';

const { useAuthMock, useQueryMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useQueryMock: vi.fn(),
}));

vi.mock('../../../../lib/instant', () => ({
  db: {
    useAuth: useAuthMock,
    useQuery: useQueryMock,
  },
}));

beforeEach(() => {
  useAuthMock.mockReset();
  useQueryMock.mockReset();
});

describe('useRecipes', () => {
  it('does not subscribe before a user is authenticated', () => {
    useAuthMock.mockReturnValue({ user: null });

    useRecipes();

    expect(useQueryMock).toHaveBeenCalledWith(null);
  });

  it('subscribes only to the current user recipes and their ingredients', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } });

    useRecipes();

    expect(useQueryMock).toHaveBeenCalledWith({
      recipes: {
        $: {
          where: {
            'user.id': 'user-1',
          },
        },
        recipe_ingredients: {},
      },
    });
  });
});

describe('useRecipeBySourceId', () => {
  it('does not subscribe without both a user and source recipe ID', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } });

    useRecipeBySourceId(undefined);

    expect(useQueryMock).toHaveBeenCalledWith(null);
  });

  it('looks up an imported recipe by indexed source ID and owner', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } });

    useRecipeBySourceId('source-recipe-1');

    expect(useQueryMock).toHaveBeenCalledWith({
      recipes: {
        $: {
          where: {
            sourceRecipeId: 'source-recipe-1',
            'user.id': 'user-1',
          },
        },
      },
    });
  });
});
