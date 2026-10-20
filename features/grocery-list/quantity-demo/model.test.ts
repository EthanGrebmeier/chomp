import { describe, expect, it } from 'vitest';

import {
  contributionSourceDetail,
  createDemoItems,
  parseAmount,
  totalAmount,
} from './model';

describe('simulated quantity contributions', () => {
  it('sums independent amounts and recalculates after edit/removal', () => {
    const entries = createDemoItems()[0].entries;
    expect(totalAmount(entries)).toBe(5);
    expect(
      totalAmount(
        entries.map(entry =>
          entry.id === 'pie' ? { ...entry, amount: '3' } : entry
        )
      )
    ).toBe(6);
    expect(totalAmount(entries.filter(entry => entry.id !== 'butter'))).toBe(4);
    expect(totalAmount(entries)).toBe(5);
  });

  it('distinguishes an empty or invalid value from zero', () => {
    for (const value of ['', ' ', '-1', 'NaN', 'Infinity', '1x', '1.2.3']) {
      expect(parseAmount(value)).toBeNull();
    }
    expect(parseAmount('0')).toBe(0);
    expect(parseAmount('1.5')).toBe(1.5);
    expect(parseAmount('1,5')).toBe(1.5);
    expect(
      totalAmount(createDemoItems().find(item => item.id === 'empty')!.entries)
    ).toBeNull();
    expect(totalAmount([])).toBe(0);
  });

  it('puts ingredient notes before structured, source-specific details', () => {
    const items = createDemoItems();
    const tomatoes = items.find(item => item.id === 'repeated')!;
    const [first, second, planned, manual] = tomatoes.entries;
    expect(first.label).toBe(second.label);
    expect(first.note).toBe('Choose ripe plum tomatoes');
    expect(first.plannedDate).not.toBe(second.plannedDate);
    expect(contributionSourceDetail(first)).toBe(
      'Planned for dinner on October 23rd'
    );
    expect(contributionSourceDetail(second)).toBe(
      'Planned for dinner on October 25th'
    );
    expect(planned.label).toBe('Meal plan');
    expect(planned.note).toBe('For lunchboxes');
    expect(planned.mealTag).toBe('Lunch');
    expect(contributionSourceDetail(planned)).toBe(
      'Planned for lunch on October 24th'
    );
    expect(contributionSourceDetail({ ...planned, mealTag: undefined })).toBe(
      'Planned for October 24th'
    );
    expect(contributionSourceDetail(manual)).toBe('Added manually');
    expect(
      contributionSourceDetail(
        items.find(item => item.id === 'mixed')!.entries[1]
      )
    ).toBe('Added from recipe');
  });

  it('creates fresh fixtures and keeps different units and history separate', () => {
    const items = createDemoItems();
    items[0].entries[0].amount = '999';
    expect(totalAmount(createDemoItems()[0].entries)).toBe(5);
    expect(
      items
        .filter(item => item.name === 'Apples' && item.status === 'active')
        .map(item => item.unit)
    ).toEqual(['each', 'g']);
    expect(
      items
        .filter(item => item.status !== 'active')
        .map(item => totalAmount(item.entries))
    ).toEqual([3, 3]);
    const repeated = items.find(item => item.id === 'repeated')!;
    expect(new Set(repeated.entries.map(entry => entry.id)).size).toBe(
      repeated.entries.length
    );
  });
});
