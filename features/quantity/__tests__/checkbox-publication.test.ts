import { afterEach, expect, it, vi } from 'vitest';

import {
  emptyListSession,
  publishListSession,
  sendAndObserveListOperation,
  type ListSession,
} from '../app/session';
import type { Operation } from '../types';

const operation: Operation = {
  id: 'toggle',
  parents: [],
  changes: [],
  guards: [],
  resolves: [],
  label: 'Check',
};
const session = (overrides: Partial<ListSession> = {}): ListSession => ({
  ...emptyListSession,
  canEdit: true,
  loading: false,
  send: vi.fn(async () => {}),
  ...overrides,
});
afterEach(() => publishListSession('list', null));

it('keeps feedback pending until the saved offline intent is published, without server confirmation', async () => {
  const current = session();
  publishListSession('list', current);
  const done = vi.fn();
  const action = sendAndObserveListOperation('list', operation).then(done);
  await vi.waitFor(() => expect(current.send).toHaveBeenCalledWith(operation));
  expect(done).not.toHaveBeenCalled();
  publishListSession('list', {
    ...current,
    pending: [{ operation }],
    connection: 'closed',
  });
  await action;
  expect(done).toHaveBeenCalledOnce();
});

it('does not complete before persistence even if publication happens first', async () => {
  let persist!: () => void;
  const current = session({
    send: () =>
      new Promise<void>(resolve => {
        persist = resolve;
      }),
  });
  publishListSession('list', current);
  const done = vi.fn();
  const action = sendAndObserveListOperation('list', operation).then(done);
  await Promise.resolve();
  publishListSession('list', { ...current, pending: [{ operation }] });
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  persist();
  await action;
  expect(done).toHaveBeenCalledOnce();
});

it('rejects a failed disk write so feedback can roll back', async () => {
  publishListSession(
    'list',
    session({
      send: async () => {
        throw new Error('disk full');
      },
    })
  );
  await expect(sendAndObserveListOperation('list', operation)).rejects.toThrow(
    'disk full'
  );
});

it('hands back to model truth when replay reports a conflict', async () => {
  const current = session();
  publishListSession('list', current);
  const action = sendAndObserveListOperation('list', operation);
  await Promise.resolve();
  publishListSession('list', {
    ...current,
    state: { ...current.state, conflicts: [{ operation, reason: 'stale' }] },
  });
  await action;
});

it('rejects when the list is removed during an action', async () => {
  publishListSession('list', session());
  const action = sendAndObserveListOperation('list', operation);
  publishListSession('list', null);
  await expect(action).rejects.toThrow('no longer available');
});
