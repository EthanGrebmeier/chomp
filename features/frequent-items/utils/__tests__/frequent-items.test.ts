import { describe, expect, it } from 'vitest';

import {
  buildFrequentItems,
  getFrequentItemsQueryCutoff,
  GroceryItemAddEvent,
  normalizeGroceryItemName,
} from '../frequent-items';

const NOW = new Date('2026-07-15T12:00:00.000Z');

const event = (
  id: string,
  name: string,
  addedAt: string,
  overrides: Partial<GroceryItemAddEvent> = {}
): GroceryItemAddEvent => ({
  id,
  normalizedName: normalizeGroceryItemName(name),
  name,
  quantity: 1,
  unit: 'each',
  addedAt,
  ...overrides,
});

describe('normalizeGroceryItemName', () => {
  it('normalizes capitalization and whitespace only', () => {
    expect(normalizeGroceryItemName('  Whole   Milk  ')).toBe('whole milk');
    expect(normalizeGroceryItemName('Apple-Sauce')).toBe('apple-sauce');
  });
});

describe('getFrequentItemsQueryCutoff', () => {
  it('keeps the query key stable throughout a UTC day', () => {
    expect(
      getFrequentItemsQueryCutoff(new Date('2026-07-15T00:00:01.000Z'))
    ).toBe('2026-04-16T00:00:00.000Z');
    expect(
      getFrequentItemsQueryCutoff(new Date('2026-07-15T23:59:59.999Z'))
    ).toBe('2026-04-16T00:00:00.000Z');
  });

  it('rolls the query key forward on the next UTC day', () => {
    expect(
      getFrequentItemsQueryCutoff(new Date('2026-07-16T00:00:00.000Z'))
    ).toBe('2026-04-17T00:00:00.000Z');
  });
});

describe('buildFrequentItems', () => {
  it('requires two additions in the rolling 90-day window', () => {
    const result = buildFrequentItems({
      now: NOW,
      currentItems: [],
      events: [
        event('1', 'Milk', '2026-07-01T12:00:00.000Z'),
        event('2', ' milk ', '2026-06-01T12:00:00.000Z'),
        event('3', 'Eggs', '2026-07-10T12:00:00.000Z'),
        event('4', 'Milk', '2026-03-01T12:00:00.000Z'),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      normalizedName: 'milk',
      count: 2,
    });
  });

  it('keeps exact rolling-window semantics with the broader query cutoff', () => {
    const result = buildFrequentItems({
      now: NOW,
      currentItems: [],
      events: [
        event('1', 'Milk', '2026-04-16T00:00:00.000Z'),
        event('2', 'Milk', '2026-04-16T12:00:00.000Z'),
        event('3', 'Milk', '2026-04-17T12:00:00.000Z'),
      ],
    });

    expect(result[0]).toMatchObject({
      normalizedName: 'milk',
      count: 2,
    });
  });

  it('uses latest details and ranks by count then recency', () => {
    const result = buildFrequentItems({
      now: NOW,
      currentItems: [],
      events: [
        event('1', 'Milk', '2026-05-01T12:00:00.000Z'),
        event('2', 'MILK', '2026-07-01T12:00:00.000Z', {
          quantity: 2,
          unit: 'gallons',
          store: { id: 'store-1', name: 'Market' },
        }),
        event('3', 'Bread', '2026-06-01T12:00:00.000Z'),
        event('4', 'Bread', '2026-07-10T12:00:00.000Z'),
        event('5', 'Apples', '2026-06-01T12:00:00.000Z'),
        event('6', 'Apples', '2026-06-10T12:00:00.000Z'),
        event('7', 'Apples', '2026-06-20T12:00:00.000Z'),
      ],
    });

    expect(result.map(item => item.normalizedName)).toEqual([
      'apples',
      'bread',
      'milk',
    ]);
    expect(result[2]).toMatchObject({
      name: 'MILK',
      quantity: 2,
      unit: 'gallons',
      storeId: 'store-1',
      storeName: 'Market',
    });
  });

  it('hides unchecked names but allows checked names', () => {
    const events = [
      event('1', 'Bananas', '2026-07-01T12:00:00.000Z'),
      event('2', 'Bananas', '2026-07-02T12:00:00.000Z'),
    ];

    expect(
      buildFrequentItems({
        now: NOW,
        events,
        currentItems: [{ name: ' BANANAS ', isChecked: false }],
      })
    ).toEqual([]);

    expect(
      buildFrequentItems({
        now: NOW,
        events,
        currentItems: [{ name: 'bananas', isChecked: true }],
      })
    ).toHaveLength(1);
  });

  it('ignores deleted rows when excluding suggestions', () => {
    const result = buildFrequentItems({
      now: NOW,
      events: [
        event('1', 'Coffee', '2026-07-01T12:00:00.000Z'),
        event('2', 'Coffee', '2026-07-02T12:00:00.000Z'),
      ],
      currentItems: [{ name: 'Coffee', isChecked: false, isDeleted: true }],
    });

    expect(result).toHaveLength(1);
  });
});
