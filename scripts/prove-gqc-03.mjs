// Bounded GQC-03 experiment: real authenticated SDK clients, isolated proof namespaces.
// Run only with the archived, explicitly authorized development app. Never application schema/rows.
import { randomUUID } from 'node:crypto';
import { init as adminInit } from '@instantdb/admin';
import { Reactor, InstantCoreDatabase } from '@instantdb/core';

const DEV_APP = '5df33e29-252b-4e1c-a111-53787beccba3';
const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID;
const token = process.env.INSTANT_APP_ADMIN_TOKEN;
if (appId !== DEV_APP || !token || process.argv[2] !== '--test-app') {
  throw new Error(
    'Expected explicit --test-app and authorized test-app credentials'
  );
}
const ns = {
  lists: 'qty02_probe_lists',
  rows: 'qty02_probe_rows',
  entries: 'qty02_probe_entries',
  sources: 'qty02_probe_sources',
};
const db = adminInit({ appId, adminToken: token });
const run = randomUUID();
const marker = `gqc03:${run}`;
const ids = Object.fromEntries(
  [
    'alice',
    'bob',
    'outsider',
    'list',
    'row',
    'addA',
    'addB',
    'scheduled',
    'source',
  ].map(name => [name, randomUUID()])
);
const fixtures = [
  ['$users', 'alice'],
  ['$users', 'bob'],
  ['$users', 'outsider'],
  [ns.lists, 'list'],
  [ns.rows, 'row'],
  [ns.sources, 'source'],
  [ns.entries, 'addA'],
  [ns.entries, 'addB'],
  [ns.entries, 'scheduled'],
];
const query = Object.fromEntries(
  [...new Set(fixtures.map(([entity]) => entity))].map(entity => [
    entity,
    {
      $: {
        where: {
          id: {
            $in: fixtures
              .filter(([e]) => e === entity)
              .map(([, name]) => ids[name]),
          },
        },
      },
    },
  ])
);
const verifyTarget = () => {
  if (
    process.env.EXPO_PUBLIC_INSTANT_APP_ID !== DEV_APP ||
    !process.env.INSTANT_APP_ADMIN_TOKEN
  )
    throw new Error('Test app target changed');
};
const api = async (path, method = 'GET', body) => {
  verifyTarget();
  const response = await fetch(`https://api.instantdb.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'app-id': appId,
      'content-type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(`Test app API ${method} failed (${response.status})`);
  return response.json();
};
const putRules = rules =>
  api(`/dash/apps/${appId}/rules`, 'POST', { code: rules });
const adminWrite = chunks => {
  verifyTarget();
  return db.transact(chunks);
};
const readFixtures = () => db.query(query);
const assertOwned = data => {
  for (const [entity, name] of fixtures) {
    if (!Array.isArray(data?.[entity])) throw new Error('Missing fixture read');
    const found = data[entity].find(record => record.id === ids[name]);
    if (
      found &&
      (entity === '$users'
        ? found.email !== `${name}-${run}@gqc03.example.invalid`
        : found.marker !== marker)
    )
      throw new Error('Fixture ownership mismatch: refusing cleanup');
  }
};
const adapters = () => {
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
  return {
    Storage,
    Network,
    setOnline(value) {
      if (!listener) throw new Error('SDK network listener missing');
      listener(value);
    },
  };
};
const until = async (fn, label) => {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
};
const clients = [];
let originalRules;
let rulesAttempted = false;
let touchedFixtures = false;
let result;
// SDK errors can include fixture data or tokens; no raw diagnostics in logs.
console.warn = () => {};
console.error = () => {};
console.log = () => {};
try {
  const schema = (await api(`/admin/schema?app_id=${appId}`)).schema;
  const required = {
    [ns.lists]: ['marker', 'memberIds'],
    [ns.rows]: ['marker', 'quantity'],
    [ns.entries]: ['marker', 'quantity', 'unit', 'intent', 'active'],
    [ns.sources]: ['marker', 'quantity', 'selected'],
  };
  for (const [entity, attrs] of Object.entries(required)) {
    if (attrs.some(attr => !schema?.blobs?.[entity]?.[attr]))
      throw new Error('Proof namespace schema is missing; refusing writes');
  }
  originalRules = (await api(`/dash/apps/${appId}/perms/pull`)).perms;
  if (
    !originalRules ||
    Object.values(ns).some(
      entity =>
        JSON.stringify(originalRules[entity]?.allow) !==
        JSON.stringify({ $default: 'false' })
    )
  )
    throw new Error(
      'Proof namespace permissions not in deny-all resting state'
    );
  const before = await readFixtures();
  assertOwned(before);
  if (fixtures.some(([entity]) => before[entity].length !== 0))
    throw new Error('Fixture IDs unexpectedly occupied');

  touchedFixtures = true;
  await adminWrite([
    ...['alice', 'bob', 'outsider'].map(name =>
      db.tx.$users[ids[name]].update({
        email: `${name}-${run}@gqc03.example.invalid`,
      })
    ),
    db.tx[ns.lists][ids.list].update({
      marker,
      memberIds: [ids.alice, ids.bob],
      authority: 'probe-only',
    }),
    db.tx[ns.rows][ids.row]
      .update({ marker, quantity: 0, revision: 0, removed: false })
      .link({ list: ids.list }),
    db.tx[ns.sources][ids.source]
      .update({ marker, selected: true, quantity: 2, revision: 0 })
      .link({ list: ids.list }),
  ]);
  // Only the existing proof namespaces are changed; everything else is preserved.
  const member = "auth.id in data.ref('list.memberIds')[0]";
  const proofRules = {
    [ns.lists]: {
      allow: { $default: 'false', view: 'auth.id in data.memberIds' },
    },
    [ns.rows]: { allow: { $default: 'false', view: member } },
    [ns.sources]: {
      allow: { $default: 'false', view: member, update: member },
    },
    [ns.entries]: {
      allow: {
        $default: 'false',
        view: member,
        create: `${member} && size(data.ref('row.id')) == 1 && data.ref('row.list.id') == data.ref('list.id') && data.quantity >= 0`,
        update: `${member} && data.quantity >= 0`,
      },
    },
  };
  rulesAttempted = true;
  await putRules({ ...originalRules, ...proofRules });
  globalThis.window = {};
  globalThis.BroadcastChannel = undefined;
  const makeClient = async name => {
    verifyTarget();
    const authToken = await db.auth.createToken({ id: ids[name] });
    const network = adapters();
    const client = new InstantCoreDatabase(
      new Reactor({ appId, devtool: false }, network.Storage, network.Network)
    );
    client.proofSetOnline = network.setOnline;
    clients.push(client);
    let status;
    client.subscribeConnectionStatus(value => {
      status = value;
    });
    await client.auth.signInWithToken(authToken);
    await until(() => status === 'authenticated', 'authentication');
    return client;
  };
  const alice = await makeClient('alice');
  const bob = await makeClient('bob');
  const outsider = await makeClient('outsider');
  const rowQuery = {
    [ns.rows]: { $: { where: { id: ids.row } }, qty02_probe_entries: {} },
  };
  const read = client => client.queryOnce(rowQuery);
  const serverEntries = async () =>
    (await db.query({ [ns.entries]: { $: { where: { 'row.id': ids.row } } } }))[
      ns.entries
    ];
  const serverTotal = async () =>
    (await serverEntries()).reduce(
      (sum, entry) => sum + (entry.active ? entry.quantity : 0),
      0
    );
  const write = async (client, chunks) => {
    try {
      return (await client.transact(chunks)).status;
    } catch {
      return 'rejected';
    }
  };
  const add = (name, quantity) =>
    db.tx[ns.entries][ids[name]]
      .update({
        marker,
        intent: name,
        quantity,
        unit: 'each',
        active: true,
        revision: 0,
      })
      .link({ list: ids.list, row: ids.row });
  const initial = await Promise.all([read(alice), read(bob)]);
  const initialComplete = initial.every(
    r => r.data?.[ns.rows]?.[0]?.qty02_probe_entries?.length === 0
  );
  const adds = await Promise.all([
    write(alice, add('addA', 1)),
    write(bob, add('addB', 2)),
  ]);
  await until(
    async () => (await serverEntries()).length === 2,
    'concurrent adds'
  );
  const retry = await write(alice, add('addA', 1));
  const afterRetry = await serverEntries();
  const changedRetry = await write(
    alice,
    db.tx[ns.entries][ids.addA].update({ quantity: 7 })
  );
  const changedRetryTotal = await serverTotal();
  await write(alice, db.tx[ns.entries][ids.addA].update({ quantity: 1 }));
  const rejectedBatch = await write(alice, [
    db.tx[ns.entries][ids.addA].update({ quantity: 9 }),
    db.tx[ns.rows][ids.row].update({ quantity: 9 }),
  ]);
  const afterRejectedBatch = await serverTotal();
  const outsiderResult = await write(outsider, add('scheduled', 4));
  const sourceAdd = await write(
    alice,
    db.tx[ns.entries][ids.scheduled]
      .update({
        marker,
        intent: 'source',
        quantity: 2,
        unit: 'each',
        active: true,
        revision: 0,
      })
      .link({ list: ids.list, row: ids.row, source: ids.source })
  );
  const sourceEdit = await write(bob, [
    db.tx[ns.sources][ids.source].update({ quantity: 3 }),
    db.tx[ns.entries][ids.scheduled].update({ quantity: 3 }),
  ]);
  const afterSourceEdit = await serverTotal();
  // This is a deliberate negative control: ID alone does not prevent same-entry overwrites.
  const sameEntry = await Promise.all([
    write(alice, db.tx[ns.entries][ids.scheduled].update({ quantity: 4 })),
    write(bob, db.tx[ns.entries][ids.scheduled].update({ quantity: 5 })),
  ]);
  const afterRace = await serverTotal();
  const bobRead = await read(bob);
  let warmData = false;
  const unsubscribe = bob.subscribeQuery(rowQuery, value => {
    if (value.data?.[ns.rows]?.[0]?.qty02_probe_entries?.length === 3)
      warmData = true;
  });
  await until(() => warmData, 'warm subscription');
  bob.proofSetOnline(false);
  let offlineQuery = 'returned';
  try {
    await read(bob);
  } catch {
    offlineQuery = 'rejected';
  }
  const offlineWrite = await write(
    bob,
    db.tx[ns.entries][ids.scheduled].update({ quantity: 6 })
  );
  const beforeReconnect = await serverTotal();
  bob.proofSetOnline(true);
  await until(async () => (await serverTotal()) === 9, 'reconnect replay');
  unsubscribe();
  result = {
    target: 'verified-test-app',
    run,
    sdk: 'installed-core',
    initialComplete,
    independentAddStatuses: adds,
    retryStatus: retry,
    afterRetry: {
      entries: afterRetry.length,
      total: afterRetry.reduce((sum, entry) => sum + entry.quantity, 0),
    },
    changedRetry: { status: changedRetry, total: changedRetryTotal },
    rejectedBatch: { status: rejectedBatch, total: afterRejectedBatch },
    outsiderStatus: outsiderResult,
    sourceAdd,
    sourceEdit,
    afterSourceEdit,
    sameEntryStatuses: sameEntry,
    afterRace,
    offline: {
      warmData,
      queryOnce: offlineQuery,
      writeStatus: offlineWrite,
      beforeReconnect,
      afterReconnect: await serverTotal(),
    },
    bobEntryCount:
      bobRead.data?.[ns.rows]?.[0]?.qty02_probe_entries?.length ?? null,
  };
  if (
    !initialComplete ||
    adds.some(status => status !== 'synced') ||
    afterRetry.length !== 2 ||
    result.afterRetry.total !== 3 ||
    afterRejectedBatch !== 3 ||
    rejectedBatch !== 'rejected' ||
    outsiderResult !== 'rejected' ||
    sourceAdd !== 'synced' ||
    sourceEdit !== 'synced'
  )
    throw new Error('GQC-03 SDK observation failed expected baseline');
} finally {
  for (const client of clients) client.shutdown();
  // Restore even if rule PUT timed out (ambiguous commit).
  if (rulesAttempted) await putRules(originalRules);
  if (touchedFixtures) {
    const current = await readFixtures();
    assertOwned(current);
    const owned = new Set(fixtures.map(([, name]) => ids[name]));
    const linked = await db.query({
      [ns.rows]: { $: { where: { id: ids.row } }, qty02_probe_entries: {} },
    });
    if (
      linked[ns.rows].some(row =>
        row.qty02_probe_entries.some(entry => !owned.has(entry.id))
      )
    )
      throw new Error(
        'Unexpected cascade target: fixture preserved for manual review'
      );
    await adminWrite(
      fixtures
        .filter(([entity]) => entity !== '$users')
        .map(([entity, name]) => db.tx[entity][ids[name]].delete())
    );
    for (const [, name] of fixtures.filter(([entity]) => entity === '$users')) {
      if (current.$users.some(user => user.id === ids[name])) {
        verifyTarget();
        await db.auth.deleteUser({ id: ids[name] });
      }
    }
    const empty = await readFixtures();
    if (fixtures.some(([entity]) => empty[entity].length !== 0))
      throw new Error('Proof fixture cleanup incomplete');
  }
  process.stdout.write(
    `${JSON.stringify(
      { ...result, cleanup: 'verified-empty', rules: 'restored' },
      null,
      2
    )}\n`
  );
  // The installed Reactor keeps timers even after shutdown.
  process.exit(0);
}
