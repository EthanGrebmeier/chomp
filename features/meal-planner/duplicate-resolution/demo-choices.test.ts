import { describe, expect, it } from 'vitest';

import { detectDuplicates } from './detection';
import {
  demoChoiceLabel,
  getDemoChoiceOptions,
  getDemoChoiceDescription,
  getDemoComparisonTarget,
  getDefaultDemoCustomAmount,
  getDefaultDemoDecisions,
  getDemoCustomAmountUnits,
  getDemoCustomAmountStoreOptions,
  getDemoDecisionSummary,
  isDemoDecisionComplete,
  parseDemoQuantity,
  type DemoCustomAmounts,
} from './demo-choices';
import { DEMO_LIST_ID, DUPLICATE_DEMO_SCENARIOS } from './demo-fixtures';

const scenario = DUPLICATE_DEMO_SCENARIOS.find(item => item.id === 'mixed')!;
const { conflicts } = detectDuplicates({ listId: DEMO_LIST_ID, ...scenario });
const spinach = conflicts.find(item => item.id === 'spinach')!;
const rice = conflicts.find(item => item.id === 'rice')!;
const tomatoes = conflicts.find(item => item.id === 'tomatoes')!;

describe('outcome card presentation choices', () => {
  it('offers both store preferences when units match', () => {
    expect(getDemoChoiceOptions(spinach)).toEqual([
      { id: 'separate', label: 'Keep separate' },
      { id: 'existing-store', label: 'Combine at Neighborhood Market' },
      { id: 'incoming-store', label: 'Combine at Farmers Market' },
    ]);
    expect(demoChoiceLabel(spinach, 'incoming-store')).toBe(
      'Combine at Farmers Market'
    );
  });

  it('offers a custom total when units differ, even if stores also differ', () => {
    expect(getDemoChoiceOptions(rice)).toEqual([
      { id: 'separate', label: 'Keep separate' },
      { id: 'custom-amount', label: 'Set a combined total' },
    ]);
    expect(
      getDemoChoiceOptions({
        ...rice,
        incoming: { ...rice.incoming, storeId: 'produce' },
      }).map(option => option.id)
    ).toEqual(['separate', 'custom-amount']);
  });

  it('starts a custom total from the list item and offers both units', () => {
    expect(getDefaultDemoCustomAmount(rice)).toEqual({
      quantity: 0.5,
      unit: 'kg',
    });
    expect(getDemoCustomAmountUnits(rice)).toEqual(['kg', 'cup']);
  });

  it('labels a custom total and treats an invalid one as incomplete', () => {
    const amount = { quantity: 0.75, unit: 'kg' };
    expect(demoChoiceLabel(rice, 'custom-amount', amount)).toBe(
      'Combine as 0.75 kg'
    );
    expect(isDemoDecisionComplete('custom-amount', amount)).toBe(true);
    expect(
      isDemoDecisionComplete('custom-amount', { quantity: null, unit: 'kg' })
    ).toBe(false);
    expect(isDemoDecisionComplete('separate')).toBe(true);
  });

  it('rejects nonpositive and nonfinite custom totals', () => {
    for (const quantity of [0, -1, Infinity, NaN]) {
      const amount = { quantity, unit: 'kg' };
      expect(isDemoDecisionComplete('custom-amount', amount)).toBe(false);
      expect(getDemoDecisionSummary(rice, 'custom-amount', amount)).toEqual({
        complete: false,
        label: 'Needs an amount',
        detail: 'Enter a new total to combine this item.',
      });
    }
    expect(isDemoDecisionComplete('custom-amount')).toBe(false);
  });

  it('shows the selected quantity and store outcome for every choice', () => {
    expect(getDemoDecisionSummary(tomatoes, 'increment')).toEqual({
      complete: true,
      label: 'Combine quantities',
      detail: '1.5 kg after combining this item · Neighborhood Market',
    });
    expect(getDemoDecisionSummary(spinach, 'separate')).toEqual({
      complete: true,
      label: 'Keep separate',
      detail: 'Add 1 bag · Farmers Market. Existing item unchanged.',
    });
    expect(getDemoDecisionSummary(spinach, 'existing-store').detail).toBe(
      '3 bag after combining this item · Neighborhood Market'
    );
    expect(getDemoDecisionSummary(spinach, 'incoming-store').detail).toBe(
      '3 bag after combining this item · Farmers Market'
    );
    expect(
      getDemoDecisionSummary(rice, 'custom-amount', {
        quantity: 2,
        unit: 'cup',
      })
    ).toEqual({
      complete: true,
      label: 'Combine as 2 cup',
      detail: '2 cup new total · Neighborhood Market',
    });
  });

  it('keeps repeated ingredients and mixed batch decisions independent', () => {
    const original = getDefaultDemoDecisions(conflicts);
    const decisions = {
      ...original,
      tomatoes: 'separate' as const,
      spinach: 'incoming-store' as const,
      rice: 'custom-amount' as const,
    };
    const amounts: DemoCustomAmounts = {
      rice: { quantity: null, unit: 'kg' },
    };
    const summaries = () =>
      Object.fromEntries(
        conflicts.map(conflict => [
          conflict.id,
          getDemoDecisionSummary(
            conflict,
            decisions[conflict.id],
            amounts[conflict.id]
          ),
        ])
      );
    const before = summaries();
    expect(before.tomatoes.label).toBe('Keep separate');
    expect(before['tomatoes-second'].label).toBe('Combine quantities');
    expect(before.spinach.label).toBe('Combine at Farmers Market');
    expect(Object.values(before).filter(item => item.complete)).toHaveLength(4);

    amounts.rice = { quantity: 0.75, unit: 'kg' };
    const after = summaries();
    expect(Object.values(after).every(item => item.complete)).toBe(true);
    expect(after.rice.label).toBe('Combine as 0.75 kg');
    for (const id of ['tomatoes', 'tomatoes-second', 'spinach', 'oil']) {
      expect(after[id]).toEqual(before[id]);
    }
    expect(original.tomatoes).toBe('increment');
    expect(original.rice).toBe('separate');
  });

  it('allows choosing either store for a custom total without changing quantity or unit', () => {
    const conflict = {
      ...rice,
      incoming: { ...rice.incoming, storeId: 'produce' },
    };
    expect(getDemoCustomAmountStoreOptions(conflict)).toEqual([
      { id: 'existing', label: 'Neighborhood Market' },
      { id: 'incoming', label: 'Farmers Market' },
    ]);
    const amount = { quantity: 2, unit: 'cup', store: 'incoming' as const };
    expect(getDemoDecisionSummary(conflict, 'custom-amount', amount)).toEqual({
      complete: true,
      label: 'Combine as 2 cup · Farmers Market',
      detail: '2 cup new total · Farmers Market',
    });
    expect(
      getDemoDecisionSummary(conflict, 'custom-amount', {
        ...amount,
        store: 'existing',
      }).detail
    ).toBe('2 cup new total · Neighborhood Market');
    expect(getDemoCustomAmountStoreOptions(rice)).toEqual([]);
  });

  it('includes an unassigned store when setting a combined total', () => {
    const conflict = {
      ...rice,
      incoming: { ...rice.incoming, storeId: null },
    };
    expect(getDemoCustomAmountStoreOptions(conflict)[1]).toEqual({
      id: 'incoming',
      label: 'No store',
    });
    expect(
      getDemoDecisionSummary(conflict, 'custom-amount', {
        quantity: 1,
        unit: 'kg',
        store: 'incoming',
      }).detail
    ).toBe('1 kg new total · No store');
  });

  it('covers every unit/store/quantity conflict state without offering a custom total for matching units', () => {
    const matrix = DUPLICATE_DEMO_SCENARIOS.find(
      item => item.id === 'conflict-states'
    )!;
    const { conflicts: cases } = detectDuplicates({
      listId: DEMO_LIST_ID,
      ...matrix,
    });
    const expected = {
      same: ['increment', 'separate'],
      quantity: ['increment', 'separate'],
      store: ['separate', 'existing-store', 'incoming-store'],
      unit: ['separate', 'custom-amount'],
      'unit-store': ['separate', 'custom-amount'],
      'no-store': ['separate', 'existing-store', 'incoming-store'],
    };
    for (const conflict of cases) {
      const options = getDemoChoiceOptions(conflict);
      expect(options.map(option => option.id)).toEqual(
        expected[conflict.id as keyof typeof expected]
      );
      for (const option of options) {
        const description = getDemoChoiceDescription(conflict, option.id);
        expect(description).not.toContain('Not decided');
        expect(description).not.toContain('NaN');
        if (option.id === 'custom-amount') {
          expect(description).toContain('No automatic conversion');
        } else {
          expect(description).not.toContain('enter the total');
        }
      }
    }
    const quantityConflict = cases.find(item => item.id === 'quantity')!;
    expect(getDemoChoiceDescription(quantityConflict, 'increment')).toBe(
      '2.5 kg after combining this item · Neighborhood Market'
    );
  });

  it('recognizes normalized matching units for automatic addition', () => {
    const { conflicts: normalized } = detectDuplicates({
      listId: DEMO_LIST_ID,
      incoming: [{ ...tomatoes.incoming, unit: ' KG ' }],
      existingItems: tomatoes.candidates,
    });
    expect(
      getDemoChoiceOptions(normalized[0]).map(option => option.id)
    ).toEqual(['increment', 'separate']);
  });

  it.each([null, undefined, ''])(
    'treats %s as an unassigned store, including unitless items',
    storeId => {
      const { conflicts: unitless } = detectDuplicates({
        listId: DEMO_LIST_ID,
        incoming: [{ ...tomatoes.incoming, unit: '', storeId }],
        existingItems: [{ ...tomatoes.candidates[0], unit: '', storeId: null }],
      });
      expect(
        getDemoChoiceOptions(unitless[0]).map(option => option.id)
      ).toEqual(['increment', 'separate']);
      expect(getDemoCustomAmountStoreOptions(unitless[0])).toEqual([]);
      expect(getDemoChoiceDescription(unitless[0], 'increment')).toBe(
        '1.5 after combining this item · No store'
      );
    }
  );

  it('never adds differing units without an explicit combined total', () => {
    for (const unit of ['g', 'cup', 'each']) {
      const { conflicts: detected } = detectDuplicates({
        listId: DEMO_LIST_ID,
        incoming: [{ ...tomatoes.incoming, unit }],
        existingItems: tomatoes.candidates,
      });
      expect(
        getDemoChoiceOptions(detected[0]).map(option => option.id)
      ).toEqual(['separate', 'custom-amount']);
    }
  });

  it('parses only positive finite quantities', () => {
    expect(parseDemoQuantity(' 1.5 ')).toBe(1.5);
    expect(parseDemoQuantity('1,5')).toBe(1.5);
    for (const text of ['', '0', '-1', 'abc', 'Infinity']) {
      expect(parseDemoQuantity(text)).toBeNull();
    }
  });

  it('offers ordinary combining for compatible items', () => {
    expect(getDemoChoiceOptions(tomatoes).map(item => item.id)).toEqual([
      'increment',
      'separate',
    ]);
  });

  it('compares against a unit-compatible candidate before offering store choices', () => {
    const wrongUnit = {
      ...spinach.candidates[0],
      id: 'wrong-unit',
      unit: 'kg',
    };
    const conflict = {
      ...spinach,
      candidates: [wrongUnit, ...spinach.candidates],
    };
    expect(getDemoComparisonTarget(conflict).id).toBe(spinach.candidates[0].id);
    expect(getDemoChoiceOptions(conflict)).toHaveLength(3);
  });

  it('labels an unassigned store without awkward store-name copy', () => {
    const conflict = {
      ...spinach,
      incoming: { ...spinach.incoming, storeId: null },
    };
    expect(getDemoChoiceOptions(conflict)[2].label).toBe(
      'Combine without a store'
    );
  });

  it('defaults to combining only compatible items', () => {
    const decisions = getDefaultDemoDecisions(conflicts);
    expect(decisions).toEqual({
      tomatoes: 'increment',
      'tomatoes-second': 'increment',
      oil: 'increment',
      spinach: 'separate',
      rice: 'separate',
    });
    for (const conflict of conflicts) {
      expect(getDemoChoiceOptions(conflict).map(option => option.id)).toContain(
        decisions[conflict.id]
      );
    }
  });
});
