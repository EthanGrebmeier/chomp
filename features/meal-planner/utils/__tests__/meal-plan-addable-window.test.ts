import { describe, expect, it } from 'vitest';

import {
  MEAL_PLAN_ADDABLE_PAST_DAYS,
  filterAddableMealPlanEntries,
  isMealPlanEntryAddable,
} from '../meal-plan-addable-window';

const reference = new Date(2024, 0, 15); // Jan 15, 2024

describe('isMealPlanEntryAddable', () => {
  it('treats today as addable', () => {
    expect(isMealPlanEntryAddable('2024-01-15', reference)).toBe(true);
  });

  it('treats future dates as addable', () => {
    expect(isMealPlanEntryAddable('2024-02-01', reference)).toBe(true);
  });

  it('treats the oldest allowed day as addable', () => {
    const oldest = `2024-01-${15 - MEAL_PLAN_ADDABLE_PAST_DAYS}`; // Jan 10
    expect(isMealPlanEntryAddable(oldest, reference)).toBe(true);
  });

  it('disregards meals older than the window', () => {
    expect(isMealPlanEntryAddable('2024-01-09', reference)).toBe(false);
  });

  it('ignores a time component on the date string', () => {
    expect(isMealPlanEntryAddable('2024-01-09T12:00:00.000Z', reference)).toBe(
      false
    );
  });

  it('fails open for unparseable dates', () => {
    expect(isMealPlanEntryAddable('not-a-date', reference)).toBe(true);
  });
});

describe('filterAddableMealPlanEntries', () => {
  it('keeps only entries within the addable window', () => {
    const entries = [
      { id: 'today', date: '2024-01-15' },
      { id: 'stale', date: '2024-01-01' },
      { id: 'future', date: '2024-01-20' },
    ];

    expect(filterAddableMealPlanEntries(entries, reference)).toEqual([
      { id: 'today', date: '2024-01-15' },
      { id: 'future', date: '2024-01-20' },
    ]);
  });
});
