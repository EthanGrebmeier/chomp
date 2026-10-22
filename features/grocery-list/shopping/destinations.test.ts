import { describe, expect, it } from 'vitest';

import type { GroceryListItemWithRecipe } from '../types';

import { getShoppingDestinations, parseShoppingSession } from './destinations';

const item = (
  overrides: Partial<GroceryListItemWithRecipe> = {}
): GroceryListItemWithRecipe => ({
  id: 'item',
  name: 'Apples',
  quantity: 1,
  unit: 'each',
  isChecked: false,
  isDeleted: false,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});
const store = (id: string, name = id) => ({
  id,
  name,
  isDefault: false,
  createdAt: '',
  updatedAt: '',
});

describe('shopping destinations', () => {
  it('counts remaining items while retaining completed stores and unassigned items', () => {
    expect(
      getShoppingDestinations([
        item({ store: store('b', 'Bravo'), isChecked: true }),
        item({ store: store('a', 'Alpha') }),
        item({ store: store('a', 'Alpha'), isChecked: true }),
        item({ isChecked: true }),
        item({ store: store('deleted'), isDeleted: true }),
      ])
    ).toEqual([
      { storeId: 'a', name: 'Alpha', remaining: 1 },
      { storeId: 'b', name: 'Bravo', remaining: 0 },
      { storeId: null, name: 'No store', remaining: 0 },
    ]);
  });

  it('uses linked store identities even for shared stores with the same name', () => {
    expect(
      getShoppingDestinations([
        item({ store: store('mine', 'Market') }),
        item({ store: store('shared', 'Market') }),
      ])
    ).toHaveLength(2);
  });

  it('does not invent an unassigned destination on an assigned or empty list', () => {
    expect(getShoppingDestinations([])).toEqual([]);
    expect(getShoppingDestinations([item({ store: store('a') })])).toHaveLength(
      1
    );
  });
});

describe('restoring shopping', () => {
  it('distinguishes exiting from the picker and No store', () => {
    expect(parseShoppingSession('null')).toBeNull();
    expect(parseShoppingSession('{"screen":"picker"}')).toEqual({
      screen: 'picker',
    });
    expect(parseShoppingSession('{"screen":"store","storeId":null}')).toEqual({
      screen: 'store',
      storeId: null,
    });
    expect(
      parseShoppingSession(
        '{"screen":"store","storeId":"a","storeName":"Market"}'
      )
    ).toEqual({ screen: 'store', storeId: 'a', storeName: 'Market' });
  });

  it.each([
    null,
    'broken',
    '{}',
    '[]',
    '{"screen":"store"}',
    '{"screen":"store","storeId":42}',
  ])('ignores invalid local state: %s', value => {
    expect(parseShoppingSession(value)).toBeNull();
  });
});
