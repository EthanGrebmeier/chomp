import { expect, it } from 'vitest';
import {
  buildLegacyQuantityOperation,
  type LegacyList,
} from '../app/legacy-import';
import { materialize, records, totalFor } from '../model';
const list: LegacyList = {
  id: 'list',
  name: 'Groceries',
  grocery_items: [
    {
      id: 'row',
      name: '',
      quantity: 2.5,
      unit: ' Each ',
      isDeleted: true,
      saved_item: { id: 'saved' },
    },
  ],
  meal_plan_items: [],
  meal_plan_recipes: [],
};
it('preserves blank names in deleted history without fabricating allocations', () => {
  let i = 0;
  const state = materialize([
    buildLegacyQuantityOperation(list, () => `id-${i++}`),
  ]);
  expect(state.complete).toBe(true);
  expect(state.conflicts).toEqual([]);
  expect(records(state, 'row')[0]).toMatchObject({
    id: 'row',
    name: '',
    status: 'deleted',
    savedItemId: 'saved',
  });
  expect(totalFor(state, 'row')).toBe(2.5);
  expect(records(state, 'entry')[0]).toMatchObject({
    origin: 'manual',
    sourceId: null,
    sourceUnit: ' Each ',
  });
});
it('continues rejecting unnamed active rows', () => {
  expect(() =>
    buildLegacyQuantityOperation(
      {
        ...list,
        grocery_items: [{ ...list.grocery_items[0], isDeleted: false }],
      },
      () => 'id'
    )
  ).toThrow('Invalid shopping row');
});
