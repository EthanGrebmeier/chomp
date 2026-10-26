import { describe, expect, it } from 'vitest';

import type { GroceryListItemWithRecipe } from '../types';

import {
  findShoppingDestination,
  getShoppingDestinations,
  getShoppingItems,
  parseShoppingSession,
} from './destinations';

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

  it('combines shared stores by name for counts, filtering, and completion', () => {
    const items = [
      item({
        id: 'mine',
        store: store('mine', 'Whole Foods'),
        isChecked: true,
      }),
      item({ id: 'shared', store: store('shared', ' whole  FOODS ') }),
      item({ id: 'other', store: store('other', 'Market') }),
      item({ store: store('deleted', 'Whole Foods'), isDeleted: true }),
    ];
    const destinations = getShoppingDestinations(items);
    expect(destinations).toHaveLength(2);
    const destination = destinations.find(d => d.name === 'Whole Foods')!;
    expect(destination.remaining).toBe(1);
    expect(getShoppingItems(items, destination).map(i => i.id)).toEqual([
      'mine',
      'shared',
    ]);
    expect(
      getShoppingDestinations(
        items.map(i => ({ ...i, isChecked: true }))
      ).every(d => d.remaining === 0)
    ).toBe(true);
  });

  it('keeps an actual store named No store separate from unassigned items', () => {
    const items = [item(), item({ store: store('named', 'No store') })];
    const destinations = getShoppingDestinations(items);
    expect(destinations).toHaveLength(2);
    expect(getShoppingItems(items, destinations[0])).toEqual([items[1]]);
    expect(getShoppingItems(items, destinations[1])).toEqual([items[0]]);
  });

  it('restores either duplicate ID and falls back to the saved name after removal', () => {
    const items = [
      item({ store: store('mine', 'Market') }),
      item({ store: store('shared', 'Market') }),
    ];
    const destinations = getShoppingDestinations(items);
    for (const storeId of ['mine', 'shared']) {
      expect(
        findShoppingDestination(destinations, items, {
          screen: 'store',
          storeId,
        })
      ).toBe(destinations[0]);
    }
    expect(
      findShoppingDestination(destinations, items, {
        screen: 'store',
        storeId: 'removed',
        storeName: ' MARKET ',
      })
    ).toBe(destinations[0]);
    expect(
      findShoppingDestination(destinations, items, {
        screen: 'store',
        storeId: 'shared',
        storeName: 'Old name',
      })
    ).toBe(destinations[0]);
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
