import { describe, expect, it } from 'vitest';

import {
  groupMealPlanEntriesByDate,
  isPageWithinActiveWindow,
} from '../meal-plan-pager';

describe('meal plan pager utilities', () => {
  it('keeps only the current page and immediate neighbors active', () => {
    expect(isPageWithinActiveWindow(29, 30)).toBe(true);
    expect(isPageWithinActiveWindow(30, 30)).toBe(true);
    expect(isPageWithinActiveWindow(31, 30)).toBe(true);
    expect(isPageWithinActiveWindow(28, 30)).toBe(false);
    expect(isPageWithinActiveWindow(32, 30)).toBe(false);
  });

  it('groups dated entries while preserving their source order', () => {
    const breakfast = { id: 'breakfast', date: '2026-08-19' };
    const dinner = { id: 'dinner', date: '2026-08-19' };
    const lunch = { id: 'lunch', date: '2026-08-20' };

    const grouped = groupMealPlanEntriesByDate([breakfast, lunch, dinner]);

    expect(grouped.get('2026-08-19')).toEqual([breakfast, dinner]);
    expect(grouped.get('2026-08-20')).toEqual([lunch]);
    expect(grouped.get('2026-08-21')).toBeUndefined();
  });
});
