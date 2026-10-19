import { describe, expect, it } from 'vitest';

import { detectDuplicates } from './detection';
import {
  getDemoConflictDifferences,
  sortDemoConflictsForReview,
} from './demo-choices';
import { DEMO_LIST_ID, DUPLICATE_DEMO_SCENARIOS } from './demo-fixtures';
import type { DuplicateConflict } from './types';

const scenario = DUPLICATE_DEMO_SCENARIOS.find(item => item.id === 'many')!;
const conflicts = detectDuplicates({
  listId: DEMO_LIST_ID,
  incoming: scenario.incoming,
  existingItems: scenario.existingItems,
}).conflicts;

const pair = (
  existing: Partial<DuplicateConflict['incoming']> = {},
  incoming: Partial<DuplicateConflict['incoming']> = {}
): DuplicateConflict => ({
  ...conflicts[1],
  incoming: { ...conflicts[1].incoming, quantity: 1, ...incoming },
  candidates: [{ ...conflicts[1].candidates[0], quantity: 1, ...existing }],
});

describe('demo duplicate review priority', () => {
  it('keeps matching quantities, units and stores easy', () => {
    expect(getDemoConflictDifferences(pair())).toEqual([]);
  });

  it('flags different quantities even when combining is supported', () => {
    const conflict = pair({ quantity: 2 });
    expect(conflict.canIncrement).toBe(true);
    expect(getDemoConflictDifferences(conflict)).toEqual([
      'Different quantities',
    ]);
  });

  it('identifies store and unit differences without comparing unlike quantities', () => {
    expect(
      getDemoConflictDifferences(
        pair({ storeId: 'produce', unit: 'g', quantity: 200 })
      )
    ).toEqual(['Different stores', 'Different units']);
  });

  it('treats an unassigned store as a difference, but null and undefined as equal', () => {
    expect(getDemoConflictDifferences(pair({ storeId: null }))).toEqual([
      'Different stores',
    ]);
    expect(
      getDemoConflictDifferences(
        pair({ storeId: null }, { storeId: undefined })
      )
    ).toEqual([]);
  });

  it('normalizes units before classifying a pair', () => {
    expect(getDemoConflictDifferences(pair({ unit: ' CUP ' }))).toEqual([]);
  });

  it('puts harder pairs first without mutating detection or changing order within groups', () => {
    const original = [...conflicts];
    const hard = conflicts.filter(
      item => getDemoConflictDifferences(item).length > 0
    );
    const easy = conflicts.filter(
      item => getDemoConflictDifferences(item).length === 0
    );
    expect(hard.length).toBeGreaterThan(0);
    expect(easy.length).toBeGreaterThan(0);
    const sorted = sortDemoConflictsForReview(conflicts);
    expect(sorted).toEqual([...hard, ...easy]);
    expect(conflicts).toEqual(original);
    expect(sorted).not.toBe(conflicts);
  });
});
