import { describe, expect, it } from 'vitest';

import {
  buildMealPlanDayListSections,
  MEAL_PLAN_DAY_LIST_FUTURE_DAYS,
  MEAL_PLAN_DAY_LIST_PAST_DAYS,
} from '../meal-plan-day-list';

describe('meal plan day list', () => {
  it('builds the inclusive prior-week and next-30-day window', () => {
    const sections = buildMealPlanDayListSections({
      anchorDate: new Date(2026, 8, 7, 15),
      recipes: [],
      items: [],
    });

    expect(sections).toHaveLength(
      MEAL_PLAN_DAY_LIST_PAST_DAYS + MEAL_PLAN_DAY_LIST_FUTURE_DAYS + 1
    );
    expect(sections[0]?.dateKey).toBe('2026-08-31');
    expect(sections.at(-1)?.dateKey).toBe('2026-10-07');
    expect(sections[MEAL_PLAN_DAY_LIST_PAST_DAYS]).toMatchObject({
      dateKey: '2026-09-07',
      label: 'Sep 7 - Monday',
      isToday: true,
    });
  });

  it('keeps local calendar dates stable across a year boundary', () => {
    const sections = buildMealPlanDayListSections({
      anchorDate: new Date(2026, 11, 10, 23, 30),
      recipes: [],
      items: [],
    });

    expect(sections[0]?.dateKey).toBe('2026-12-03');
    expect(sections.at(-1)?.dateKey).toBe('2027-01-09');
    expect(sections.filter(section => section.isToday)).toHaveLength(1);
  });

  it('creates stable typed identities for entries on each day', () => {
    const sections = buildMealPlanDayListSections({
      anchorDate: new Date(2026, 8, 7),
      recipes: [
        { id: 'recipe-1', date: '2026-09-07', name: 'Soup' },
        { id: 'recipe-2', date: '2026-09-08', name: 'Tacos' },
      ],
      items: [{ id: 'item-1', date: '2026-09-07', name: 'Fruit' }],
    });
    const today = sections[MEAL_PLAN_DAY_LIST_PAST_DAYS];

    expect(
      today?.entries.map(({ type, id, date }) => ({ type, id, date }))
    ).toEqual([
      { type: 'recipe', id: 'recipe-1', date: '2026-09-07' },
      { type: 'item', id: 'item-1', date: '2026-09-07' },
    ]);
    expect(
      sections[MEAL_PLAN_DAY_LIST_PAST_DAYS + 1]?.entries[0]
    ).toMatchObject({
      type: 'recipe',
      id: 'recipe-2',
      date: '2026-09-08',
    });
  });
});
