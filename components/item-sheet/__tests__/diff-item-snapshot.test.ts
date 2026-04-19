import { describe, expect, it } from 'vitest';

import {
  diffItemSnapshot,
  ItemSnapshot,
} from '../diff-item-snapshot';

const baseSnapshot: ItemSnapshot = {
  name: 'Milk',
  category: 'Dairy',
  notes: 'Whole',
  quantity: 1,
  unit: 'each',
  storeId: 'store-1',
};

describe('diffItemSnapshot', () => {
  it('returns an empty object when snapshot equals current', () => {
    expect(
      diffItemSnapshot({ snapshot: baseSnapshot, current: { ...baseSnapshot } })
    ).toEqual({});
  });

  it('detects a name diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, name: 'Oat Milk' },
      })
    ).toEqual({ name: 'Oat Milk' });
  });

  it('detects a category diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, category: 'Beverages' },
      })
    ).toEqual({ category: 'Beverages' });
  });

  it('detects a notes diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, notes: 'Skim' },
      })
    ).toEqual({ notes: 'Skim' });
  });

  it('detects a quantity diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, quantity: 3 },
      })
    ).toEqual({ quantity: 3 });
  });

  it('detects a unit diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, unit: 'cup' },
      })
    ).toEqual({ unit: 'cup' });
  });

  it('detects a storeId diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, storeId: 'store-2' },
      })
    ).toEqual({ storeId: 'store-2' });
  });

  it('treats trailing whitespace in strings as non-diffs', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: {
          ...baseSnapshot,
          name: 'Milk ',
          category: ' Dairy',
          notes: 'Whole   ',
          unit: ' each ',
        },
      })
    ).toEqual({});
  });

  it('treats leading whitespace in strings as non-diffs', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, name: '  Milk' },
      })
    ).toEqual({});
  });

  it('treats empty string and undefined as equivalent for optional string fields', () => {
    const snapshot: ItemSnapshot = {
      name: 'Milk',
      category: undefined,
      notes: undefined,
      quantity: 1,
      unit: 'each',
      storeId: undefined,
    };

    expect(
      diffItemSnapshot({
        snapshot,
        current: {
          ...snapshot,
          category: '',
          notes: '',
          storeId: '',
        },
      })
    ).toEqual({});
  });

  it('treats whitespace-only strings as equivalent to undefined for optional fields', () => {
    const snapshot: ItemSnapshot = {
      name: 'Milk',
      category: undefined,
      notes: undefined,
      quantity: 1,
      unit: 'each',
      storeId: undefined,
    };

    expect(
      diffItemSnapshot({
        snapshot,
        current: {
          ...snapshot,
          category: '   ',
          notes: '\t\n',
        },
      })
    ).toEqual({});
  });

  it('reports a diff when an optional string field goes from set to cleared', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: { ...baseSnapshot, category: undefined },
      })
    ).toEqual({ category: undefined });
  });

  it('reports a diff when an optional string field goes from undefined to a real value', () => {
    const snapshot: ItemSnapshot = {
      ...baseSnapshot,
      category: undefined,
      notes: undefined,
    };

    expect(
      diffItemSnapshot({
        snapshot,
        current: { ...snapshot, category: 'Pantry', notes: 'Shelf A' },
      })
    ).toEqual({ category: 'Pantry', notes: 'Shelf A' });
  });

  it('reports only the changed fields in a multi-field diff', () => {
    expect(
      diffItemSnapshot({
        snapshot: baseSnapshot,
        current: {
          ...baseSnapshot,
          name: 'Oat Milk',
          quantity: 2,
          storeId: 'store-2',
        },
      })
    ).toEqual({ name: 'Oat Milk', quantity: 2, storeId: 'store-2' });
  });

  it('preserves the raw current value (not trimmed) in the diff payload', () => {
    expect(
      diffItemSnapshot({
        snapshot: { ...baseSnapshot, name: 'Milk' },
        current: { ...baseSnapshot, name: '  Oat Milk  ' },
      })
    ).toEqual({ name: '  Oat Milk  ' });
  });
});
