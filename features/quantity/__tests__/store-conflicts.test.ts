import { describe, expect, it } from 'vitest';
import { materialize, records, totalFor } from '../model';
import { manualAdd, addEntryToRow } from '../shopping';
import { QuantityTransaction } from '../transaction';
import {
  completeStoreDestinations,
  inspectStoreConflicts,
} from '../store-conflicts';
import type { Ingredient, Operation } from '../types';

const item = (id: string, store = 'a', unit = 'each'): Ingredient => ({
  id,
  name: 'Apples',
  quantity: 2,
  unit,
  store,
  notes: '',
  category: '',
});
const genesis: Operation = {
  id: 'genesis',
  label: 'List',
  parents: [],
  guards: [],
  resolves: [],
  changes: [
    {
      id: 'list',
      before: null,
      value: { kind: 'list', id: 'list', name: 'List' },
    },
  ],
};
let sequence = 0;
const newId = () => `generated-${++sequence}`;
function fixture() {
  const history = [genesis];
  for (const incoming of [item('a'), item('b', 'b'), item('grams', 'a', 'g')])
    history.push(manualAdd(materialize(history), newId, 'list', incoming));
  return materialize(history);
}

describe('store-only duplicate review', () => {
  it('automatically chooses the exact store even when other stores match', () => {
    const state = fixture();
    const result = inspectStoreConflicts(state, 'list', [
      { ...item('incoming'), name: ' APPLES ', unit: ' EACH ' },
    ]);
    expect(result.conflicts).toEqual([]);
    expect(result.destinations.incoming.store).toBe('a');
    expect(state.documents[result.destinations.incoming.rowId!]).toMatchObject({
      store: 'a',
      unit: 'each',
    });
  });
  it('reviews only matching-unit store differences, including no store', () => {
    const result = inspectStoreConflicts(fixture(), 'list', [
      item('unassigned', ''),
      item('different-unit', 'c', 'kg'),
    ]);
    expect(result.conflicts.map(c => c.item.id)).toEqual(['unassigned']);
    expect(result.conflicts[0].rows.map(r => r.row.store).sort()).toEqual([
      'a',
      'b',
    ]);
  });
  it('ignores purchased, deleted and other-list rows', () => {
    const state = fixture();
    records(state, 'row').forEach((row, index) => {
      state.documents[row.id] = {
        ...row,
        status: index === 0 ? 'checked' : 'deleted',
      };
    });
    expect(
      inspectStoreConflicts(state, 'list', [item('incoming')]).conflicts
    ).toEqual([]);
    expect(
      inspectStoreConflicts(fixture(), 'other-list', [item('incoming')])
        .destinations
    ).toEqual({});
  });
  it('groups repeated incoming items without losing their independent contributions', () => {
    const state = materialize([genesis]);
    const incoming = [
      item('first'),
      item('second'),
      item('different-store', 'b'),
      item('different-unit', 'a', 'g'),
    ];
    const destinations = completeStoreDestinations('list', incoming, {}, newId);
    const tx = new QuantityTransaction(state);
    for (const ingredient of incoming)
      addEntryToRow(
        tx,
        newId,
        'list',
        ingredient,
        {
          quantity: ingredient.quantity,
          origin: 'recipe',
          sourceName: ingredient.id,
          sourceNotes: '',
          sourceDate: '',
          mealTag: '',
          sourceId: null,
          mealId: null,
        },
        destinations[ingredient.id]
      );
    const next = materialize([genesis, tx.build(newId(), 'Add recipe')]);
    expect(next.conflicts).toEqual([]);
    expect(records(next, 'row')).toHaveLength(3);
    expect(records(next, 'entry')).toHaveLength(4);
    expect(totalFor(next, destinations.first.newRow!.id)).toBe(4);
  });
  it('preserves explicit separation and rejects contradictory stores for one target', () => {
    expect(
      completeStoreDestinations('list', [item('first')], { first: {} }, newId)
        .first
    ).toEqual({});
    expect(() =>
      completeStoreDestinations(
        'list',
        [item('first'), item('second')],
        {
          first: { rowId: 'row', store: 'a' },
          second: { rowId: 'row', store: 'b' },
        },
        newId
      )
    ).toThrow('same store');
  });
});
