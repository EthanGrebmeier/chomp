import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { InstantCoreDatabase, Reactor, i, id } from '@instantdb/core';

const binding = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock('@/lib/instant', () => ({
  get db() {
    return binding.db;
  },
}));
import { transactLocally } from '../local-transaction';

// Exercise the installed SDK and its real PersistedObject serialization, with
// disk and transport replaced. No credentials or network requests are needed.
const disk = new Map<string, unknown>();
let failWrites = false;
let releaseWrite: (() => void) | undefined;
let blockWrites = false;
class Storage {
  constructor(
    private appId: string,
    private name: string
  ) {}
  key(key: string) {
    return `${this.name}:${key}`;
  }
  async getItem(key: string) {
    return structuredClone(disk.get(this.key(key)) ?? null);
  }
  async removeItem(key: string) {
    disk.delete(this.key(key));
  }
  async getAllKeys() {
    return [...disk.keys()]
      .filter(k => k.startsWith(`${this.name}:`))
      .map(k => k.slice(this.name.length + 1));
  }
  async multiSet(pairs: [string, unknown][]) {
    if (blockWrites)
      await new Promise<void>(resolve => {
        releaseWrite = resolve;
      });
    if (failWrites) throw new Error('Disk full');
    for (const [key, value] of pairs)
      disk.set(this.key(key), structuredClone(value));
  }
}
class Network {
  static async getIsOnline() {
    return false;
  }
  static listen() {
    return () => {};
  }
}
const schema = i.schema({
  entities: { notes: i.entity({ title: i.string() }) },
});
let reactor: Reactor;
let client: InstantCoreDatabase<typeof schema>;
async function start() {
  reactor = new Reactor(
    { appId: '00000000-0000-4000-8000-000000000001', schema, devtool: false },
    Storage,
    Network
  );
  client = new InstantCoreDatabase(reactor);
  binding.db = {
    core: client,
    getAuth: () => client.getAuth(),
    transact: (chunks: Parameters<typeof client.transact>[0]) =>
      client.transact(chunks),
  };
  await reactor.kv.waitForMetaToLoad();
  await reactor.kv.waitForKeyToLoad('pendingMutations');
}
beforeEach(async () => {
  vi.stubGlobal('window', {});
  vi.stubGlobal('BroadcastChannel', undefined);
  disk.clear();
  failWrites = false;
  blockWrites = false;
  releaseWrite = undefined;
  // The SDK stores currentUser as JSON inside its KV store.
  disk.set(
    'kv:currentUser',
    JSON.stringify({ id: 'user-a', refresh_token: 'offline-token' })
  );
  await start();
});
afterEach(() => {
  reactor.shutdown();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('persists offline edits before resolving and restores their queue on cold restart', async () => {
  const noteId = id();
  await transactLocally(
    client.tx.notes[noteId].update({ title: 'Offline edit' })
  );
  const before = [...reactor._pendingMutations().entries()];
  expect(before).toHaveLength(1);
  reactor.shutdown();
  await start();
  expect([...reactor._pendingMutations().entries()]).toEqual(before);
});

it('finishes local saves even when the server acknowledgement never resolves', async () => {
  vi.spyOn(reactor, '_sendMutation').mockImplementation(() => {});
  await transactLocally(client.tx.notes[id()].update({ title: 'First' }));
  await transactLocally(client.tx.notes[id()].update({ title: 'Second' }));
  expect(reactor._pendingMutations().size).toBe(2);
});

it('does not acknowledge a write until storage finishes', async () => {
  blockWrites = true;
  let complete = false;
  const save = transactLocally(
    client.tx.notes[id()].update({ title: 'Wait for disk' })
  ).then(() => {
    complete = true;
  });
  await vi.waitFor(() => expect(releaseWrite).toBeDefined());
  expect(complete).toBe(false);
  blockWrites = false;
  releaseWrite?.();
  await save;
  expect(complete).toBe(true);
});

it('reports disk failure and persists the queue on a subsequent successful save', async () => {
  failWrites = true;
  await expect(
    transactLocally(client.tx.notes[id()].update({ title: 'First' }))
  ).rejects.toThrow('Disk full');
  failWrites = false;
  await transactLocally(client.tx.notes[id()].update({ title: 'Second' }));
  reactor.shutdown();
  await start();
  expect(reactor._pendingMutations().size).toBe(2);
});

it('rejects invalid transactions instead of reporting local success', async () => {
  // Invalid scalar values are rejected by the real SDK validation path.
  await expect(
    transactLocally(
      client.tx.notes[id()].update({ title: 3 as unknown as string })
    )
  ).rejects.toBeDefined();
});

it('does not write without a signed-in account', async () => {
  vi.spyOn(client, 'getAuth').mockResolvedValue(null);
  await expect(
    transactLocally(client.tx.notes[id()].update({ title: 'Private' }))
  ).rejects.toThrow('Sign in');
  expect(reactor._pendingMutations().size).toBe(0);
});

it('rejects waiting edits when the account changes while disk is busy', async () => {
  blockWrites = true;
  const first = transactLocally(
    client.tx.notes[id()].update({ title: 'First' })
  );
  const firstResult = expect(first).rejects.toThrow('Account changed');
  await vi.waitFor(() => expect(releaseWrite).toBeDefined());
  const second = transactLocally(
    client.tx.notes[id()].update({ title: 'Second' })
  );
  const secondResult = expect(second).rejects.toThrow('Account changed');
  // Let the second invocation capture its author before switching accounts.
  await Promise.resolve();
  await Promise.resolve();
  vi.spyOn(client, 'getAuth').mockResolvedValue({
    id: 'user-b',
    refresh_token: 'other-token',
  });
  blockWrites = false;
  releaseWrite?.();
  await Promise.all([firstResult, secondResult]);
  expect(reactor._pendingMutations().size).toBe(1);
});

it('reports a late server rejection after local completion', async () => {
  vi.spyOn(reactor, '_sendMutation').mockImplementation(() => {});
  const onError = vi.fn();
  const unsubscribe = reactor.__subscribeMutationErrors(onError);
  await transactLocally(client.tx.notes[id()].update({ title: 'Denied' }));
  const eventId = [...reactor._pendingMutations().keys()][0];
  reactor._handleMutationError('error', eventId, {
    message: 'Permission denied',
  });
  await Promise.resolve();
  expect(onError).toHaveBeenCalledOnce();
  expect(reactor._pendingMutations().size).toBe(0);
  unsubscribe();
});
