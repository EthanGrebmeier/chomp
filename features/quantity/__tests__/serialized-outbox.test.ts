import { expect, it, vi } from 'vitest';

vi.mock('@instantdb/react-native', () => ({ id: () => 'query' }));
vi.mock('@/lib/instant', () => ({ db: {} }));

import { materialize, totalFor } from '../model';
import { extraQuantity } from '../shopping';
import { readWorkspaceState } from '../sync-workspace';
import type { Operation } from '../types';

it('overlays offline intents after the committed prefix and removes the overlay after acknowledgement', () => {
  const base: Operation = {
    id: 'base',
    parents: [],
    label: 'Initialize',
    guards: [],
    resolves: [],
    commit: { sequence: 1, parents: [] },
    changes: [
      {
        id: 'list',
        before: null,
        value: { kind: 'list', id: 'list', name: 'Groceries' },
      },
      {
        id: 'row',
        before: null,
        value: {
          kind: 'row',
          id: 'row',
          listId: 'list',
          name: 'Milk',
          notes: '',
          category: '',
          store: '',
          unit: 'each',
          status: 'active',
        },
      },
    ],
  };
  let n = 0;
  const id = () => `id-${++n}`;
  const remote = {
    ...extraQuantity(materialize([base]), id, 'row', 3),
    commit: { sequence: 2, parents: [base.id] },
  };
  const offline = extraQuantity(materialize([base]), id, 'row', 4);
  const rows = [base, remote].map(op => ({
    id: op.id,
    body: JSON.stringify(op),
  }));
  const optimistic = readWorkspaceState([], [{ operation: offline }], rows, 1);
  expect(optimistic.complete).toBe(true);
  expect(optimistic.conflicts).toEqual([]);
  expect(totalFor(optimistic, 'row')).toBe(7);
  const acknowledged = {
    ...offline,
    commit: { sequence: 3, parents: [remote.id] },
  };
  const confirmed = readWorkspaceState(
    [acknowledged],
    [{ operation: offline }],
    [...rows, { id: acknowledged.id, body: JSON.stringify(acknowledged) }],
    1
  );
  expect(confirmed.complete).toBe(true);
  expect(totalFor(confirmed, 'row')).toBe(7);
  expect(materialize([base, remote, offline]).complete).toBe(false);
});
