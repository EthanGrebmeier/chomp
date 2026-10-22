import { describe, expect, it } from 'vitest';

import {
  commitOperations,
  decodeHistory,
  serialKey,
  type CommitPlan,
  type CommitStore,
  type StoredOperation,
} from '../commits';
import { materialize, record, totalFor } from '../model';
import {
  deleteRows,
  editQuantity,
  editShoppingDetails,
  extraQuantity,
} from '../shopping';
import { buildCrossListMove } from '../cross-list-move';
import { QuantityTransaction } from '../transaction';
import type { Operation } from '../types';

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};
function setup() {
  const newId = ids();
  const rows: StoredOperation[] = [];
  for (const listId of ['source', 'target']) {
    const tx = new QuantityTransaction(materialize([]));
    tx.put({ kind: 'list', id: listId, name: listId });
    if (listId === 'source') {
      tx.put({
        kind: 'row',
        id: 'row',
        listId,
        name: 'Milk',
        unit: 'each',
        notes: '',
        store: '',
        category: '',
        status: 'active',
      });
      tx.put({
        kind: 'entry',
        id: 'entry',
        rowId: 'row',
        quantity: 2,
        unit: 'each',
        origin: 'manual',
        sourceName: '',
        sourceDate: '',
        sourceNotes: '',
        sourceId: null,
        mealId: null,
        mealTag: '',
      });
    }
    const operation = tx.build(newId(), 'Initialize');
    rows.push({
      id: operation.id,
      workspaceId: listId,
      authorId: 'owner',
      body: JSON.stringify(operation),
    });
  }
  const store: CommitStore = {
    read: async workspaceId =>
      structuredClone(rows.filter(r => r.workspaceId === workspaceId)),
    write: async plans => {
      const incoming = plans.map(p => ({
        id: p.operation.id,
        workspaceId: p.workspaceId,
        authorId: 'owner',
        body: JSON.stringify(p.operation),
        serialKey: serialKey(p.workspaceId, p.operation),
      }));
      if (
        incoming.some(r =>
          rows.some(old => old.id === r.id || old.serialKey === r.serialKey)
        )
      )
        throw new Error('Unique slot collision');
      rows.push(...incoming);
      return { status: 'synced' };
    },
  };
  const state = (list: string) =>
    materialize(decodeHistory(rows.filter(r => r.workspaceId === list)));
  const source = state('source');
  const target = new QuantityTransaction(state('target'));
  target.put({
    ...record(source, 'row', 'row'),
    id: 'moved-row',
    listId: 'target',
  });
  target.put({
    ...record(source, 'entry', 'entry'),
    id: 'moved-entry',
    rowId: 'moved-row',
  });
  const move: CommitPlan[] = [
    { workspaceId: 'source', operation: deleteRows(source, newId, ['row']) },
    { workspaceId: 'target', operation: target.build(newId(), 'Move in') },
  ];
  return { rows, store, state, move, newId };
}
describe('serialized multi-list commits', () => {
  it.each(['quantity', 'metadata', 'delete'] as const)(
    'rejects a stale move after a source %s change',
    async kind => {
      const { store, state, move, newId } = setup();
      const operation =
        kind === 'quantity'
          ? editQuantity(state('source'), newId, 'entry', 7)
          : kind === 'metadata'
            ? editShoppingDetails(state('source'), newId, 'row', {
                notes: 'Changed',
              })
            : deleteRows(state('source'), newId, ['row']);
      await commitOperations(
        store,
        [{ workspaceId: 'source', operation }],
        'owner',
        true
      );
      await expect(
        commitOperations(store, move, 'owner', true)
      ).rejects.toThrow('Nothing was moved or deleted');
      expect(state('target').documents['moved-row']).toBeUndefined();
    }
  );
  it('accepts only one of two competing moves', async () => {
    const { store, state, newId } = setup();
    const first = buildCrossListMove(
      state('source'),
      state('target'),
      ['row'],
      'target',
      newId
    );
    const second = buildCrossListMove(
      state('source'),
      state('target'),
      ['row'],
      'target',
      newId
    );
    const results = await Promise.allSettled([
      commitOperations(store, first, 'owner', true),
      commitOperations(store, second, 'owner', true),
    ]);
    expect(
      results.filter(result => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      Object.values(state('target').documents).filter(d => d.kind === 'entry')
    ).toHaveLength(1);
  });
  it('rejects both halves when a source add wins the slot race', async () => {
    const { store, state, move, newId } = setup();
    const add = extraQuantity(state('source'), newId, 'row', 3);
    const write = store.write;
    let race = true;
    const racing: CommitStore = {
      ...store,
      write: async plans => {
        if (race) {
          race = false;
          await commitOperations(
            store,
            [{ workspaceId: 'source', operation: add }],
            'owner'
          );
        }
        return write(plans);
      },
    };
    await expect(commitOperations(racing, move, 'owner', true)).rejects.toThrow(
      'Nothing was moved or deleted'
    );
    expect(totalFor(state('source'), 'row')).toBe(5);
    expect(state('source').documents.row).toMatchObject({ status: 'active' });
    expect(state('target').documents['moved-row']).toBeUndefined();
  });
  it('retains a late stale add as a conflict without reversing an accepted move', async () => {
    const { store, state, move, newId } = setup();
    const stale = extraQuantity(state('source'), newId, 'row', 3);
    await commitOperations(store, move, 'owner', true);
    await commitOperations(
      store,
      [{ workspaceId: 'source', operation: stale }],
      'owner'
    );
    expect(state('source').documents.row).toMatchObject({ status: 'deleted' });
    expect(state('source').conflicts.map(c => c.operation.id)).toContain(
      stale.id
    );
    expect(totalFor(state('target'), 'moved-row')).toBe(2);
  });
  it('retries after an unrelated destination edit without losing it', async () => {
    const { store, state, move, newId } = setup();
    const edit = new QuantityTransaction(state('target'));
    edit.put({ kind: 'list', id: 'target', name: 'New name' });
    const write = store.write;
    let race = true;
    const racing: CommitStore = {
      ...store,
      write: async plans => {
        if (race) {
          race = false;
          await commitOperations(
            store,
            [
              {
                workspaceId: 'target',
                operation: edit.build(newId(), 'Rename'),
              },
            ],
            'owner'
          );
        }
        return write(plans);
      },
    };
    await commitOperations(racing, move, 'owner', true);
    expect(state('target').documents.target).toMatchObject({
      name: 'New name',
    });
    expect(totalFor(state('target'), 'moved-row')).toBe(2);
  });
  it('recognizes a lost acknowledgement of the whole batch without duplicating it', async () => {
    const { store, state, move } = setup();
    let writes = 0;
    const uncertain: CommitStore = {
      ...store,
      write: async plans => {
        writes++;
        await store.write(plans);
        throw new Error('Lost response');
      },
    };
    await commitOperations(uncertain, move, 'owner', true);
    expect(writes).toBe(1);
    expect(totalFor(state('target'), 'moved-row')).toBe(2);
  });
  it('fails closed on missing slots and a reused slot', () => {
    const { rows } = setup();
    const base = JSON.parse(rows[0].body) as Operation;
    const op = {
      ...base,
      id: 'next',
      changes: [],
      commit: { sequence: 2, parents: [base.id] },
    };
    expect(materialize([base, op]).complete).toBe(false);
    const first = { ...op, commit: { sequence: 1, parents: [base.id] } };
    expect(
      materialize([base, first, { ...first, id: 'duplicate-slot' }]).complete
    ).toBe(false);
  });
});
