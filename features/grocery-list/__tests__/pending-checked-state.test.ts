import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyPendingCheckedState,
  beginPendingCheckedState,
  endPendingCheckedState,
  getPendingCheckedState,
  isPendingCheckedStateCurrent,
  resetPendingCheckedStateForTests,
} from '../pending-checked-state';

beforeEach(() => {
  resetPendingCheckedStateForTests();
});

describe('pending checked state store', () => {
  it('records intent and exposes it in the snapshot', () => {
    beginPendingCheckedState('item-1', true);

    expect(getPendingCheckedState().get('item-1')).toBe(true);
  });

  it('lets a newer toggle supersede an older one for the same item', () => {
    const staleToken = beginPendingCheckedState('item-1', true);
    const freshToken = beginPendingCheckedState('item-1', false);

    expect(isPendingCheckedStateCurrent('item-1', staleToken)).toBe(false);
    expect(isPendingCheckedStateCurrent('item-1', freshToken)).toBe(true);
    expect(getPendingCheckedState().get('item-1')).toBe(false);
  });

  it('ignores an end from a superseded token', () => {
    const staleToken = beginPendingCheckedState('item-1', true);
    beginPendingCheckedState('item-1', false);

    endPendingCheckedState('item-1', staleToken);

    expect(getPendingCheckedState().get('item-1')).toBe(false);
  });

  it('clears intent when the current token ends', () => {
    const token = beginPendingCheckedState('item-1', true);

    endPendingCheckedState('item-1', token);

    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('publishes a new snapshot reference on each change', () => {
    const initial = getPendingCheckedState();
    const token = beginPendingCheckedState('item-1', true);
    const afterBegin = getPendingCheckedState();
    endPendingCheckedState('item-1', token);
    const afterEnd = getPendingCheckedState();

    expect(afterBegin).not.toBe(initial);
    expect(afterEnd).not.toBe(afterBegin);
  });
});

describe('applyPendingCheckedState', () => {
  const items = [
    { id: 'item-1', isChecked: false, name: 'Milk' },
    { id: 'item-2', isChecked: true, name: 'Eggs' },
    { id: 'item-3', name: 'Bread' },
  ];

  it('returns the same array when there is no pending intent', () => {
    expect(applyPendingCheckedState(items, new Map())).toBe(items);
  });

  it('returns the same array when pending intent matches the data', () => {
    const pending = new Map([
      ['item-1', false],
      ['item-2', true],
      ['item-3', false],
    ]);

    expect(applyPendingCheckedState(items, pending)).toBe(items);
  });

  it('overrides only the items whose intent differs, keeping other references', () => {
    const pending = new Map([
      ['item-1', true],
      ['item-2', true],
    ]);

    const result = applyPendingCheckedState(items, pending);

    expect(result).not.toBe(items);
    expect(result[0]).toEqual({ id: 'item-1', isChecked: true, name: 'Milk' });
    expect(result[0]).not.toBe(items[0]);
    expect(result[1]).toBe(items[1]);
    expect(result[2]).toBe(items[2]);
  });

  it('treats a missing isChecked as unchecked when comparing intent', () => {
    const result = applyPendingCheckedState(items, new Map([['item-3', true]]));

    expect(result[2]).toEqual({ id: 'item-3', isChecked: true, name: 'Bread' });
  });

  it('ignores intent for items not in the list', () => {
    expect(applyPendingCheckedState(items, new Map([['other', true]]))).toBe(
      items
    );
  });
});
