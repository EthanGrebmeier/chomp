import { InstantCoreDatabase, Reactor } from '@instantdb/core';
import { assertTestTarget } from './test-target.mjs';

export const until = async (condition, label) => {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
};

export async function clientFor(admin, userId, workspaceId) {
  const appId = assertTestTarget(process.env);
  const values = new Map();
  let listener;
  class Storage {
    async getItem(key) {
      return values.get(key) ?? null;
    }
    async removeItem(key) {
      values.delete(key);
    }
    async multiSet(pairs) {
      for (const [key, value] of pairs) values.set(key, value);
    }
    async getAllKeys() {
      return [...values.keys()];
    }
  }
  class Network {
    static async getIsOnline() {
      return true;
    }
    static listen(callback) {
      listener = callback;
      return () => {
        listener = undefined;
      };
    }
  }
  const reactor = new Reactor({ appId, devtool: false }, Storage, Network);
  const client = new InstantCoreDatabase(reactor);
  let connection;
  client.subscribeConnectionStatus(value => {
    connection = value;
  });
  const errors = [];
  const diagnostics = [];
  const receive = reactor._handleReceiveError.bind(reactor);
  reactor._handleReceiveError = message => {
    if (reactor._pendingMutations().has(message['client-event-id'])) {
      errors.push(message.type);
      diagnostics.push({
        type: message.type,
        message: message.message,
        hint: message.hint,
      });
    }
    return receive(message);
  };
  await client.auth.signInWithToken(
    await admin.auth.createToken({ id: userId })
  );
  await until(() => connection === 'authenticated', 'authenticated SDK');
  await client.queryOnce({
    gqc_workspaces_v1: { $: { where: { id: workspaceId } } },
  });
  return {
    client,
    reactor,
    errors,
    diagnostics,
    setOnline: value => listener(value),
    isConnected: () => connection === 'authenticated',
  };
}
