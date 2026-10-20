import { describe, expect, it } from 'vitest';

import { addEntry, deriveTotal, syncSource, type Entry } from './gqc-03-model';

const manual: Entry = {
  id: 'manual-intent-a',
  rowId: 'apples',
  quantity: 2,
  unit: ' Each ',
  active: true,
};
const planned: Entry = {
  id: 'scheduled-snapshot-a',
  rowId: 'apples',
  sourceId: 'meal-a',
  quantity: 2,
  unit: 'each',
  active: true,
};
const total = (entries: readonly Entry[]) =>
  deriveTotal('apples', 'each', { state: 'complete', entries });

describe('GQC-03 candidate: entries are quantity authority', () => {
  it('preserves two independent adds regardless of their ordering', () => {
    const another = { ...manual, id: 'manual-intent-b', quantity: 3 };
    expect(total(addEntry(addEntry([], manual), another))).toBe(5);
    expect(total(addEntry(addEntry([], another), manual))).toBe(5);
  });

  it('does not double count an exact retry, but rejects reuse of an ID', () => {
    expect(total(addEntry(addEntry([], manual), manual))).toBe(2);
    expect(() => addEntry([manual], { ...manual, quantity: 3 })).toThrow(
      'different intent'
    );
  });

  it('only changes its own active source and never rewrites manual entries', () => {
    expect(total(syncSource([manual, planned], 'meal-a', 3, true))).toBe(5);
    const deselected = syncSource([manual, planned], 'meal-a', 2, false);
    expect(total(deselected)).toBe(2);
    expect(total(syncSource(deselected, 'meal-a', 4, true))).toBe(2);
  });

  it('refuses an incomplete read rather than displaying or writing zero', () => {
    for (const state of ['loading', 'offline', 'error'] as const) {
      expect(deriveTotal('apples', 'each', { state })).toBeNull();
    }
    expect(total([])).toBe(0);
    expect(total([{ ...planned, unit: 'g' }])).toBeNull();
    expect(total([{ ...manual, quantity: Infinity }])).toBeNull();
  });
});
