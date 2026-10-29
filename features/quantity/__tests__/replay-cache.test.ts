import { expect, it } from 'vitest';
import { initialOperations } from '../fixtures';
import { createMaterializer, materialize, records } from '../model';
import { QuantityTransaction } from '../transaction';
import { record } from '../model';
import type { QuantityState } from '../types';
function checkRow(
  state: QuantityState,
  id: () => string,
  rowId: string,
  checked: boolean
) {
  const tx = new QuantityTransaction(state);
  const row = record(state, rowId, 'row');
  tx.requireEntries(rowId);
  tx.put({ ...row, status: checked ? 'checked' : 'active' });
  return tx.build(id(), 'Toggle');
}
import type { Operation } from '../types';

function fixture() {
  let counter = 0;
  const id = () => `cache-${String(++counter).padStart(6, '0')}`;
  const operations = initialOperations(id);
  const replay = createMaterializer();
  const row = records(replay(operations), 'row')[0];
  return { id, operations, replay, row };
}

it('matches full replay through repeated checks, reversals, and cloned server publications', () => {
  const f = fixture();
  for (let i = 0; i < 30; i++) {
    const state = f.replay(f.operations);
    f.operations.push(checkRow(state, f.id, f.row.id, i % 2 === 0));
    expect(f.replay(JSON.parse(JSON.stringify(f.operations)))).toEqual(
      materialize(f.operations)
    );
  }
});

it('reuses unchanged document objects without mutating earlier results', () => {
  const f = fixture();
  const before = f.replay(f.operations);
  const snapshot = JSON.stringify(before);
  const unrelated = records(before, 'recipe')[0];
  f.operations.push(checkRow(before, f.id, f.row.id, true));
  const after = f.replay(f.operations);
  expect(after.documents[unrelated.id]).toBe(before.documents[unrelated.id]);
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after).toEqual(materialize(f.operations));
});

it('invalidates the suffix for changed history and concurrent conflicts', () => {
  const f = fixture();
  const base = f.replay(f.operations);
  const first = checkRow(base, f.id, f.row.id, true);
  const concurrent = checkRow(base, f.id, f.row.id, false);
  const histories = [
    [...f.operations, first],
    [...f.operations, concurrent, first],
    [...f.operations, concurrent],
    f.operations,
    [...f.operations, first],
  ];
  for (const history of histories)
    expect(f.replay(history)).toEqual(materialize(history));
});

it('still rejects malformed, missing, and reused identities after warming the cache', () => {
  const f = fixture();
  const changed = JSON.parse(JSON.stringify(f.operations[0])) as Operation;
  changed.label = 'different payload for same id';
  const histories = [
    [...f.operations, changed],
    f.operations.slice(1),
    [
      ...f.operations,
      { ...f.operations[0], changes: null } as unknown as Operation,
    ],
  ];
  for (const history of histories) {
    expect(f.replay(history)).toEqual(materialize(history));
    expect(f.replay(history).complete).toBe(false);
  }
  expect(f.replay(f.operations)).toEqual(materialize(f.operations));
});

it('revalidates committed-history rules when optimistic permission changes', () => {
  const f = fixture();
  const op = checkRow(f.replay(f.operations), f.id, f.row.id, true);
  const committed = { ...op, commit: { sequence: 1, parents: op.parents } };
  const next = checkRow(
    materialize([...f.operations, committed]),
    f.id,
    f.row.id,
    false
  );
  const history = [...f.operations, committed, next];
  expect(f.replay(history, new Set([next.id]))).toEqual(
    materialize(history, new Set([next.id]))
  );
  expect(f.replay(history)).toEqual(materialize(history));
  expect(f.replay(history).complete).toBe(false);
});
