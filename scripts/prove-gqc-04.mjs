// Bounded schema + permission experiment, NOT an actual old application build.
// node --env-file=.env.local scripts/prove-gqc-04.mjs --test-app
// Recovery: same command with --cleanup <run-id> appended. Keep tmp/gqc04/<run-id>.json.
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { init as adminInit } from '@instantdb/admin';
import { Reactor, InstantCoreDatabase } from '@instantdb/core';
import {
  TEST_APP,
  verifyTarget,
  makeModel,
  canonical,
  digest,
  rulesFor,
  outsideRules,
  allAttrs,
  schemaContract,
  assertIsolatedSchema,
} from './gqc-04-fence-model.mjs';

verifyTarget(process.env, process.argv[2]);
const cleanupRun = process.argv[3] === '--cleanup' ? process.argv[4] : null;
if (
  (process.argv.length !== 3 && !cleanupRun) ||
  (cleanupRun && process.argv.length !== 5)
)
  throw new Error('Usage: --test-app [--cleanup <run-id>]');
const run = cleanupRun ?? randomUUID();
const model = makeModel(run); // validates run before using it in a path
const recoveryPath = new URL(`../tmp/gqc04/${run}.json`, import.meta.url);
const evidencePath = new URL(
  `../plans/grocery-quantity-contributions/evidence/gqc04-${run}.json`,
  import.meta.url
);
let manifest = cleanupRun
  ? JSON.parse(readFileSync(recoveryPath, 'utf8'))
  : {
      model,
      marker: `gqc04:${run}`,
      fixtures: [],
      originalRules: null,
      originalSchema: null,
      schemaAttempted: false,
      rulesAttempted: false,
    };
if (
  cleanupRun &&
  (manifest.model.run !== run ||
    manifest.model.prefix !== model.prefix ||
    canonical(manifest.model.entities) !== canonical(model.entities))
)
  throw new Error('Recovery manifest mismatch');
const m = manifest.model;
const old = m.ns.old;
const updated = m.ns.new;
const report = {
  kind: 'GQC-04-isolated-SDK-emulation-not-actual-build',
  run,
  target: 'allowlisted-test-app',
  startedAt: new Date().toISOString(),
  scriptSha256: createHash('sha256')
    .update(readFileSync(new URL(import.meta.url)))
    .digest('hex'),
  modelSha256: createHash('sha256')
    .update(readFileSync(new URL('./gqc-04-fence-model.mjs', import.meta.url)))
    .digest('hex'),
  sdk: JSON.parse(
    readFileSync(
      new URL('../node_modules/@instantdb/core/package.json', import.meta.url),
      'utf8'
    )
  ).version,
  observations: [],
  gate: 'BLOCKED-actual-build-and-full-application-graph-not-tested',
  cleanup: 'not-started',
};
const save = () => {
  mkdirSync(new URL('../tmp/gqc04/', import.meta.url), { recursive: true });
  writeFileSync(recoveryPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  // A recovery-only run does not replace the original experiment evidence.
  if (!cleanupRun) {
    mkdirSync(
      new URL(
        '../plans/grocery-quantity-contributions/evidence/',
        import.meta.url
      ),
      { recursive: true }
    );
    writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
  }
};
const observe = (name, facts) => {
  report.observations.push({ name, ...facts });
  save();
};
const check = (value, label) => {
  if (!value) throw new Error(label);
};
const timed = (promise, label, ms = 20000) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async (fn, label) => {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await fn()) return;
    await wait(100);
  }
  throw new Error(`Timeout: ${label}`);
};
// Bound admin/auth requests as well as direct API requests. Never log raw SDK errors.
const originalFetch = globalThis.fetch;
globalThis.fetch = (url, options = {}) =>
  originalFetch(url, {
    ...options,
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  });
console.log = console.warn = console.error = () => {};
const db = adminInit({
  appId: TEST_APP,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
const api = async (path, method = 'GET', body) => {
  verifyTarget(process.env, '--test-app');
  const response = await fetch(`https://api.instantdb.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.INSTANT_APP_ADMIN_TOKEN}`,
      'app-id': TEST_APP,
      'content-type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`Test API ${method} failed (${response.status})`);
  return response.json();
};
const getSchema = async () =>
  (await api(`/admin/schema?app_id=${TEST_APP}`)).schema;
const getRules = async () =>
  (await api(`/dash/apps/${TEST_APP}/perms/pull`)).perms;
const adminWrite = chunks => {
  verifyTarget(process.env, '--test-app');
  return db.transact(chunks);
};
const setRules = async scoped => {
  const current = await getRules();
  check(
    canonical(outsideRules(current, m.entities)) ===
      canonical(manifest.originalRules),
    'Non-proof rules changed concurrently; refusing overwrite'
  );
  manifest.rulesAttempted = true;
  save(); // durable recovery before an ambiguous network write
  await api(`/dash/apps/${TEST_APP}/rules`, 'POST', {
    code: { ...manifest.originalRules, ...scoped },
  });
  check(
    canonical(await getRules()) ===
      canonical({ ...manifest.originalRules, ...scoped }),
    'Rule read-back mismatch'
  );
};
const putSchema = steps =>
  api(`/dash/apps/${TEST_APP}/schema/steps/apply`, 'POST', { steps });
const fixture = (entity, key) => {
  const value = { entity, key, id: randomUUID() };
  manifest.fixtures.push(value);
  save();
  return value.id;
};
const ids = {};
const tx = db.tx;
const clients = [];
const sortRecords = value => {
  if (Array.isArray(value))
    return value.map(sortRecords).sort((a, b) => a.id.localeCompare(b.id));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, sortRecords(v)])
    );
  return value;
};
const graphQuery = () =>
  Object.fromEntries(
    m.entities.map(entity => [
      entity,
      Object.fromEntries(
        m.links
          .filter(([from]) => from === entity)
          .map(([, label]) => [label, {}])
      ),
    ])
  );
const graph = async () => sortRecords(await db.query(graphQuery()));
const graphDigest = async () => digest(await graph());
const assertOwned = data => {
  for (const entity of m.entities) {
    check(Array.isArray(data[entity]), 'Incomplete fixture read');
    for (const record of data[entity]) {
      check(
        record.marker === manifest.marker &&
          manifest.fixtures.some(
            f => f.entity === entity && f.id === record.id
          ),
        'Unknown proof record; refusing cleanup'
      );
      for (const [from, label, target] of m.links.filter(
        ([from]) => from === entity
      )) {
        void from;
        for (const linked of record[label] ?? [])
          check(
            manifest.fixtures.some(
              f => f.entity === target && f.id === linked.id
            ),
            'Unknown proof link target'
          );
      }
    }
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
      check(listener, 'Missing network listener');
      listener(value);
    },
  };
};
const safeType = value =>
  typeof value === 'string' && /^[a-z-]{1,60}$/.test(value)
    ? value
    : 'unclassified';
const makeClient = async (user, label) => {
  const network = adapters();
  const reactor = new Reactor(
    { appId: TEST_APP, devtool: false },
    network.Storage,
    network.Network
  );
  const client = new InstantCoreDatabase(reactor);
  const serverErrors = new Map();
  // Test instrumentation only: captures actual WebSocket error types correlated to event IDs.
  // It does not alter permission checks, SDK transaction processing or server responses.
  const receiveError = reactor._handleReceiveError.bind(reactor);
  reactor._handleReceiveError = msg => {
    if (reactor._pendingMutations().has(msg['client-event-id']))
      serverErrors.set(msg['client-event-id'], {
        type: safeType(msg.type),
        status: msg.status ?? null,
      });
    return receiveError(msg);
  };
  const acknowledgements = new Set();
  const finishTransaction = reactor._finishTransaction.bind(reactor);
  reactor._finishTransaction = (status, eventId, error) => {
    if (status === 'synced') acknowledgements.add(eventId);
    return finishTransaction(status, eventId, error);
  };
  const record = {
    client,
    reactor,
    network,
    serverErrors,
    acknowledgements,
    label,
  };
  clients.push(record);
  let connection;
  client.subscribeConnectionStatus(status => {
    connection = status;
  });
  const token = await db.auth.createToken({ id: user });
  await timed(client.auth.signInWithToken(token), 'sign-in');
  await until(() => connection === 'authenticated', 'authenticated socket');
  // Authentication notifications can precede the post-sign-in socket/schema reset.
  // A server query is the readiness barrier; an empty authorized result is fine.
  await timed(
    client.queryOnce({ [old.lists]: { $: { where: { id: ids.oldList } } } }),
    'post-authentication server query'
  );
  return record;
};
const write = async (client, chunks) => {
  const before = new Set(client.serverErrors.keys());
  try {
    const result = await timed(
      client.client.transact(chunks),
      'SDK transaction'
    );
    return { status: result.status, eventId: result.eventId };
  } catch (error) {
    const errors = [...client.serverErrors.entries()].filter(
      ([id]) => !before.has(id)
    );
    return {
      status: 'rejected',
      errorName: error.name,
      server: errors.map(([, result]) => result),
    };
  }
};
const requireDenied = outcome =>
  outcome.status === 'rejected' &&
  outcome.server?.length === 1 &&
  outcome.server[0].type === 'permission-denied';
const runCase = async (client, name, chunks, expected) => {
  const before = await graphDigest();
  const outcome = await write(client, chunks);
  const after = await graphDigest();
  const pass =
    expected === 'rejected'
      ? requireDenied(outcome) && before === after
      : outcome.status === 'synced';
  observe(name, {
    client: client.label,
    expected,
    ...outcome,
    unchanged: before === after,
    before,
    after,
    pass,
  });
  check(pass, `Case failed: ${name}`);
};
const row = (names, id, list, quantity = 2) =>
  tx[names.rows][id]
    .update({
      marker: manifest.marker,
      name: 'Apples',
      unit: 'each',
      notes: '',
      category: 'Produce',
      isChecked: false,
      isDeleted: false,
      ...(names === old ? { quantity } : {}),
    })
    .link({ list });
const source = (names, id, list) =>
  tx[names.sources][id]
    .update({
      marker: manifest.marker,
      name: 'Planned apples',
      quantity: 2,
      unit: 'each',
      selected: true,
      ignored: false,
    })
    .link({ list });
const member = (names, id, list, user) =>
  tx[names.members][id]
    .update({ marker: manifest.marker, userId: user })
    .link({ list });
const entry = (id, quantity, kind = 'manual', extra = {}) =>
  tx[updated.entries][id]
    .update({
      marker: manifest.marker,
      quantity,
      unit: 'each',
      kind,
      active: true,
    })
    .link({ list: ids.newList, row: ids.newRow, ...extra });

let stage = 'preflight';
let failed = false;
try {
  if (!cleanupRun) {
    manifest.originalRules = await getRules();
    manifest.originalSchema = await getSchema();
    check(
      manifest.originalRules.attrs?.allow?.$default === 'false',
      'Unknown-attribute creation is not denied'
    );
    check(
      !Object.keys(manifest.originalRules).some(name =>
        m.entities.includes(name)
      ),
      'Proof rules already exist'
    );
    check(
      !allAttrs(manifest.originalSchema).some(
        attr =>
          m.entities.includes(attr['forward-identity'][1]) ||
          m.entities.includes(attr['reverse-identity']?.[1])
      ),
      'Proof namespace collision'
    );
    report.originalRulesDigest = digest(manifest.originalRules);
    report.originalSchemaDigest = digest(
      schemaContract(manifest.originalSchema)
    );
    save();
    stage = 'install-isolated-schema';
    // Deny proof namespaces before schema/fixtures exist. No application rule changes.
    await setRules(
      Object.fromEntries(
        m.entities.map(entity => [entity, { allow: { $default: 'false' } }])
      )
    );
    manifest.schemaAttempted = true;
    save();
    await putSchema(m.attrs.map(attr => ['add-attr', attr]));
    const schema = await getSchema();
    assertIsolatedSchema(schema, m);
    check(
      m.attrs.every(attr =>
        allAttrs(schema).some(remote => remote.id === attr.id)
      ),
      'Missing installed schema attr'
    );
    check(
      canonical(schemaContract(manifest.originalSchema)) ===
        canonical(
          schemaContract({
            blobs: Object.fromEntries(
              Object.entries(schema.blobs).filter(
                ([entity]) => !m.entities.includes(entity)
              )
            ),
            refs: Object.fromEntries(
              Object.entries(schema.refs).filter(
                ([, attr]) => !m.entities.includes(attr['forward-identity'][1])
              )
            ),
          })
        ),
      'Non-proof schema changed during installation'
    );
    observe('schema-installed', {
      entities: m.entities.length,
      attributes: m.attrs.length,
      noCrossGenerationLinks: true,
      applicationSchemaUnchanged: true,
    });
    stage = 'seed-fixtures';
    for (const name of ['alice', 'bob', 'outsider'])
      ids[name] = fixture('$users', name);
    for (const [generation, names] of Object.entries(m.ns)) {
      for (const name of ['List', 'OtherList'])
        ids[`${generation}${name}`] = fixture(
          names.lists,
          `${generation}${name}`
        );
      for (const name of ['AliceMember', 'BobMember', 'OtherMember'])
        ids[`${generation}${name}`] = fixture(
          names.members,
          `${generation}${name}`
        );
      ids[`${generation}Row`] = fixture(names.rows, `${generation}Row`);
      ids[`${generation}Source`] = fixture(
        names.sources,
        `${generation}Source`
      );
    }
    ids.newOtherRow = fixture(updated.rows, 'newOtherRow');
    ids.manual = fixture(updated.entries, 'manual');
    ids.scheduled = fixture(updated.entries, 'scheduled');
    ids.direct = fixture(updated.entries, 'direct');
    ids.createdSource = fixture(updated.sources, 'createdSource');
    ids.createdScheduled = fixture(updated.entries, 'createdScheduled');
    ids.newGrant = fixture(updated.members, 'newGrant');
    ids.newExtraList = fixture(updated.lists, 'newExtraList');
    ids.newExtraMember = fixture(updated.members, 'newExtraMember');
    ids.newExtraRow = fixture(updated.rows, 'newExtraRow');
    ids.oldCreatedRow = fixture(old.rows, 'oldCreatedRow');
    ids.oldCreatedSource = fixture(old.sources, 'oldCreatedSource');
    ids.oldCreatedMember = fixture(old.members, 'oldCreatedMember');
    ids.oldCreatedList = fixture(old.lists, 'oldCreatedList');
    manifest.ids = ids;
    save();
    const userQuery = {
      $users: {
        $: { where: { id: { $in: [ids.alice, ids.bob, ids.outsider] } } },
      },
    };
    check(
      (await db.query(userQuery)).$users.length === 0,
      'User fixture collision'
    );
    await adminWrite([
      ...['alice', 'bob', 'outsider'].map(name =>
        tx.$users[ids[name]].update({
          email: `${name}-${run}@gqc04.example.invalid`,
        })
      ),
      ...Object.entries(m.ns).flatMap(([generation, names]) => [
        tx[names.lists][ids[`${generation}List`]].update({
          marker: manifest.marker,
          name: 'Shared list',
          ownerId: ids.alice,
        }),
        tx[names.lists][ids[`${generation}OtherList`]].update({
          marker: manifest.marker,
          name: 'Outsider list',
          ownerId: ids.outsider,
        }),
        member(
          names,
          ids[`${generation}AliceMember`],
          ids[`${generation}List`],
          ids.alice
        ),
        member(
          names,
          ids[`${generation}BobMember`],
          ids[`${generation}List`],
          ids.bob
        ),
        member(
          names,
          ids[`${generation}OtherMember`],
          ids[`${generation}OtherList`],
          ids.outsider
        ),
        row(names, ids[`${generation}Row`], ids[`${generation}List`]),
        source(names, ids[`${generation}Source`], ids[`${generation}List`]),
      ]),
      tx[old.rows][ids.oldRow].link({ source: ids.oldSource }),
      row(updated, ids.newOtherRow, ids.newOtherList),
      entry(ids.manual, 2),
      entry(ids.scheduled, 2, 'scheduled', { source: ids.newSource }),
    ]);
    assertOwned(await graph());
    await setRules(rulesFor(m, 'legacy'));
    globalThis.window = {};
    globalThis.BroadcastChannel = undefined;
    const online = await makeClient(ids.bob, 'legacy-online-member');
    const queued = await makeClient(ids.bob, 'legacy-offline-member');
    const owner = await makeClient(ids.alice, 'updated-owner');
    const current = await makeClient(ids.bob, 'updated-member');
    const outsider = await makeClient(ids.outsider, 'updated-outsider');
    stage = 'legacy-baseline-and-negative-control';
    await runCase(
      online,
      'legacy-before-fence-scalar-allowed',
      tx[old.rows][ids.oldRow].update({ quantity: 3 }),
      'synced'
    );
    await setRules(rulesFor(m, 'row-frozen'));
    await runCase(
      online,
      'row-only-freeze-rejects-scalar',
      tx[old.rows][ids.oldRow].update({ quantity: 7 }),
      'rejected'
    );
    await runCase(
      online,
      'row-only-freeze-still-allows-source-edit',
      tx[old.sources][ids.oldSource].update({ quantity: 7 }),
      'synced'
    );
    await runCase(
      online,
      'row-only-freeze-still-allows-list-rename',
      tx[old.lists][ids.oldList].update({ name: 'Old rename' }),
      'synced'
    );
    await setRules(rulesFor(m, 'legacy'));
    await adminWrite([
      tx[old.rows][ids.oldRow].update({ quantity: 2 }),
      tx[old.sources][ids.oldSource].update({ quantity: 2 }),
      tx[old.lists][ids.oldList].update({ name: 'Shared list' }),
    ]);
    const oldCases = [
      ['scalar', tx[old.rows][ids.oldRow].update({ quantity: 9 })],
      [
        'stale-metadata',
        tx[old.rows][ids.oldRow].update({
          name: 'Stale apples',
          notes: 'old payload',
          category: 'Other',
          unit: 'each',
          quantity: 1,
        }),
      ],
      ['checked', tx[old.rows][ids.oldRow].update({ isChecked: true })],
      ['soft-delete', tx[old.rows][ids.oldRow].update({ isDeleted: true })],
      [
        'source-edit',
        tx[old.sources][ids.oldSource].update({
          quantity: 8,
          selected: false,
          ignored: true,
        }),
      ],
      ['source-delete', tx[old.sources][ids.oldSource].delete()],
      [
        'source-unlink',
        tx[old.rows][ids.oldRow].unlink({ source: ids.oldSource }),
      ],
      ['row-delete', tx[old.rows][ids.oldRow].delete()],
      ['reconcile-create', row(old, ids.oldCreatedRow, ids.oldList, 4)],
      ['source-create', source(old, ids.oldCreatedSource, ids.oldList)],
      [
        'reconcile-relink',
        tx[old.rows][ids.oldRow]
          .unlink({ source: ids.oldSource })
          .link({ source: ids.oldSource }),
      ],
      ['move-destination', row(old, ids.oldCreatedRow, ids.oldList, 4)],
      [
        'move-source',
        [
          tx[old.rows][ids.oldRow].delete(),
          tx[old.sources][ids.oldSource].update({ selected: false }),
        ],
      ],
      [
        'list-rename',
        tx[old.lists][ids.oldList].update({ name: 'Old rename' }),
      ],
      [
        'list-create',
        tx[old.lists][ids.oldCreatedList].update({
          marker: manifest.marker,
          name: 'Old list',
          ownerId: ids.bob,
        }),
      ],
      [
        'membership-edit',
        tx[old.members][ids.oldBobMember].update({ userId: ids.outsider }),
      ],
      ['membership-delete', tx[old.members][ids.oldBobMember].delete()],
      [
        'membership-unlink',
        tx[old.members][ids.oldBobMember].unlink({ list: ids.oldList }),
      ],
      ['list-unlink', tx[old.rows][ids.oldRow].unlink({ list: ids.oldList })],
    ];
    // Warm schema/data before disconnect: these are genuinely pre-fence queued transactions.
    const warmQuery = {
      [old.rows]: { $: { where: { id: ids.oldRow } }, source: {} },
    };
    let warm = false;
    const unsubscribe = queued.client.subscribeQuery(warmQuery, result => {
      if (result.data?.[old.rows]?.length === 1) warm = true;
    });
    await until(() => warm, 'warm old-client subscription');
    queued.network.setOnline(false);
    const queue = [];
    const beforeQueue = await graphDigest();
    for (const [name, chunks] of oldCases) {
      const outcome = await write(queued, chunks);
      check(outcome.status === 'enqueued', `Old offline ${name} not enqueued`);
      queue.push({
        name,
        eventId: outcome.eventId,
        enqueueStatus: outcome.status,
      });
    }
    check(
      (await graphDigest()) === beforeQueue,
      'Offline queue reached server before reconnect'
    );
    observe('pre-fence-offline-queue', {
      warmSubscription: true,
      transactions: queue.length,
      statuses: queue.map(({ name, enqueueStatus }) => ({
        name,
        enqueueStatus,
      })),
      unchanged: true,
    });
    stage = 'full-fence-online';
    await setRules(rulesFor(m, 'fenced'));
    report.proofRules = rulesFor(m, 'fenced');
    report.proofSchema = m.attrs;
    save();
    for (const [name, chunks] of oldCases)
      await runCase(online, `fenced-online-${name}`, chunks, 'rejected');
    await runCase(
      owner,
      'fenced-online-list-delete-owner',
      tx[old.lists][ids.oldList].delete(),
      'rejected'
    );
    await runCase(
      owner,
      'fenced-online-membership-create-owner',
      member(old, ids.oldCreatedMember, ids.oldList, ids.alice),
      'rejected'
    );
    await runCase(
      online,
      'fenced-online-reverse-source-unlink',
      tx[old.sources][ids.oldSource].unlink({ rows: ids.oldRow }),
      'rejected'
    );
    stage = 'full-fence-offline-replay';
    const beforeReconnect = await graphDigest();
    queued.network.setOnline(true);
    await until(
      () => queue.every(item => queued.serverErrors.has(item.eventId)),
      'server rejections for every queued mutation'
    );
    const replay = queue.map(item => ({
      ...item,
      server: queued.serverErrors.get(item.eventId),
    }));
    const unchanged = (await graphDigest()) === beforeReconnect;
    const pending = queue.filter(item =>
      queued.reactor._pendingMutations().has(item.eventId)
    ).length;
    observe('fenced-offline-replay', {
      results: replay,
      unchanged,
      pending,
      pass:
        unchanged &&
        pending === 0 &&
        replay.every(item => item.server.type === 'permission-denied'),
    });
    check(
      unchanged &&
        pending === 0 &&
        replay.every(item => item.server.type === 'permission-denied'),
      'Offline replay fence failed'
    );
    unsubscribe();
    const cold = await makeClient(ids.bob, 'legacy-cold-schema-member');
    await runCase(
      cold,
      'fenced-cold-client-scalar',
      tx[old.rows][ids.oldRow].update({ quantity: 10 }),
      'rejected'
    );
    stage = 'updated-shared-list-flows';
    await runCase(
      current,
      'updated-member-row-metadata',
      tx[updated.rows][ids.newRow].update({
        name: 'Fresh apples',
        notes: 'row only',
      }),
      'synced'
    );
    await runCase(
      current,
      'updated-member-direct-add',
      entry(ids.direct, 3, 'direct-recipe'),
      'synced'
    );
    await runCase(
      current,
      'updated-member-entry-edit',
      tx[updated.entries][ids.manual].update({ quantity: 4 }),
      'synced'
    );
    await runCase(
      current,
      'updated-member-source-edit',
      [
        tx[updated.sources][ids.newSource].update({ quantity: 5 }),
        tx[updated.entries][ids.scheduled].update({ quantity: 5 }),
      ],
      'synced'
    );
    let state = await graph();
    check(
      state[updated.entries].length === 3 &&
        state[updated.entries].reduce((sum, e) => sum + e.quantity, 0) === 12,
      'Updated entry quantities not preserved'
    );
    observe('updated-server-postcondition', {
      entries: 3,
      total: 12,
      scalarOnNewRow: Object.hasOwn(
        state[updated.rows].find(r => r.id === ids.newRow),
        'quantity'
      ),
    });
    await runCase(
      current,
      'updated-member-entry-remove',
      tx[updated.entries][ids.direct].delete(),
      'synced'
    );
    await runCase(
      current,
      'updated-member-source-remove',
      [
        tx[updated.entries][ids.scheduled].delete(),
        tx[updated.sources][ids.newSource].delete(),
      ],
      'synced'
    );
    await runCase(
      current,
      'updated-member-source-create',
      [
        source(updated, ids.createdSource, ids.newList),
        entry(ids.createdScheduled, 2, 'scheduled', {
          source: ids.createdSource,
        }),
      ],
      'synced'
    );
    await runCase(
      current,
      'updated-member-created-source-remove',
      [
        tx[updated.entries][ids.createdScheduled].delete(),
        tx[updated.sources][ids.createdSource].delete(),
      ],
      'synced'
    );
    await runCase(
      current,
      'updated-row-scalar-attribute-denied',
      tx[updated.rows][ids.newRow].update({ quantity: 99 }),
      'rejected'
    );
    check(
      !allAttrs(await getSchema()).some(
        attr =>
          attr['forward-identity'][1] === updated.rows &&
          attr['forward-identity'][2] === 'quantity'
      ),
      'Rejected scalar attribute was created'
    );
    await runCase(
      current,
      'updated-member-list-rename',
      tx[updated.lists][ids.newList].update({ name: 'Updated shared list' }),
      'synced'
    );
    await runCase(
      owner,
      'updated-owner-list-create',
      [
        tx[updated.lists][ids.newExtraList].update({
          marker: manifest.marker,
          name: 'Extra',
          ownerId: ids.alice,
        }),
        member(updated, ids.newExtraMember, ids.newExtraList, ids.alice),
        row(updated, ids.newExtraRow, ids.newExtraList),
      ],
      'synced'
    );
    await runCase(
      owner,
      'updated-owner-remove-extra-row-list',
      [
        tx[updated.rows][ids.newExtraRow].delete(),
        tx[updated.members][ids.newExtraMember].delete(),
        tx[updated.lists][ids.newExtraList].delete(),
      ],
      'synced'
    );
    await runCase(
      outsider,
      'updated-outsider-row-edit',
      tx[updated.rows][ids.newRow].update({ notes: 'Unauthorized' }),
      'rejected'
    );
    await runCase(
      outsider,
      'updated-outsider-entry-create',
      entry(ids.direct, 9),
      'rejected'
    );
    await runCase(
      outsider,
      'updated-outsider-membership-create',
      member(updated, ids.newGrant, ids.newList, ids.outsider),
      'rejected'
    );
    await runCase(
      current,
      'updated-member-owner-escalation',
      tx[updated.lists][ids.newList].update({ ownerId: ids.bob }),
      'rejected'
    );
    await runCase(
      current,
      'updated-cross-list-entry-link',
      tx[updated.entries][ids.manual].link({ row: ids.newOtherRow }),
      'rejected'
    );
    await runCase(
      current,
      'updated-legacy-batch-atomic-rejection',
      [
        tx[updated.entries][ids.manual].update({ quantity: 77 }),
        tx[old.sources][ids.oldSource].update({ quantity: 77 }),
      ],
      'rejected'
    );
    await runCase(
      owner,
      'updated-owner-grant-membership',
      member(updated, ids.newGrant, ids.newList, ids.outsider),
      'synced'
    );
    await runCase(
      outsider,
      'updated-newly-granted-member-edit',
      tx[updated.rows][ids.newRow].update({ notes: 'Authorized after grant' }),
      'synced'
    );
    await runCase(
      owner,
      'updated-owner-revoke-membership',
      tx[updated.members][ids.newGrant].delete(),
      'synced'
    );
    await runCase(
      outsider,
      'updated-revoked-member-edit',
      tx[updated.rows][ids.newRow].update({ notes: 'Denied after revoke' }),
      'rejected'
    );
    let updatedWarm = false;
    const stopUpdated = current.client.subscribeQuery(
      {
        [updated.rows]: { $: { where: { id: ids.newRow } }, entries: {} },
      },
      result => {
        if (result.data?.[updated.rows]?.length === 1) updatedWarm = true;
      }
    );
    await until(() => updatedWarm, 'warm updated subscription');
    current.network.setOnline(false);
    const updatedBefore = await graphDigest();
    const updatedQueued = await write(
      current,
      tx[updated.rows][ids.newRow].update({ notes: 'Updated offline note' })
    );
    check(
      updatedQueued.status === 'enqueued' &&
        (await graphDigest()) === updatedBefore,
      'Updated offline baseline failed'
    );
    current.network.setOnline(true);
    await until(
      () => current.acknowledgements.has(updatedQueued.eventId),
      'updated replay acknowledgement'
    );
    check(
      (await graph())[updated.rows].find(r => r.id === ids.newRow).notes ===
        'Updated offline note',
      'Updated replay missing on server'
    );
    observe('updated-offline-replay', {
      enqueueStatus: updatedQueued.status,
      serverStatus: 'synced',
      persistedNote: true,
      pass: true,
    });
    stopUpdated();
    await runCase(
      current,
      'updated-member-leave',
      tx[updated.members][ids.newBobMember].delete(),
      'synced'
    );
    await runCase(
      current,
      'updated-departed-member-edit',
      tx[updated.entries][ids.manual].update({ quantity: 88 }),
      'rejected'
    );
    state = await graph();
    check(
      state[updated.entries].length === 1 &&
        state[updated.entries][0].quantity === 4,
      'Updated final quantity mismatch'
    );
    observe('final-server-postcondition', {
      entries: 1,
      total: 4,
      legacyScalar: state[old.rows][0].quantity,
      legacySourceQuantity: state[old.sources][0].quantity,
    });
    report.boundedResult = 'PASS-disjoint-namespace-fence-only';
  }
} catch (error) {
  failed = true;
  // Avoid leaking auth tokens, raw SDK errors or remote record data.
  report.failure = {
    stage,
    category: error.name,
    detail:
      error.name === 'Error'
        ? error.message
        : 'SDK/API failure (raw details withheld)',
  };
  save();
} finally {
  for (const { client } of clients) client.shutdown();
  try {
    stage = 'cleanup';
    if (manifest.rulesAttempted)
      await setRules(
        Object.fromEntries(
          m.entities.map(entity => [entity, { allow: { $default: 'false' } }])
        )
      );
    if (manifest.schemaAttempted) {
      const schema = await getSchema();
      assertIsolatedSchema(schema, m);
      const presentEntities = m.entities.filter(entity => schema.blobs[entity]);
      if (presentEntities.length) {
        // Normal setup is atomic; refuse automatic partial-schema recovery if queries are unsafe.
        check(
          presentEntities.length === m.entities.length,
          'Partial schema: manual recovery required'
        );
        const current = await graph();
        assertOwned(current);
        await adminWrite(
          m.entities.flatMap(entity =>
            current[entity].map(record => tx[entity][record.id].delete())
          )
        );
        check(
          Object.values(await graph()).every(records => records.length === 0),
          'Proof records remain'
        );
      }
      const ownedIds = new Set(m.attrs.map(attr => attr.id));
      const presentAttrs = allAttrs(await getSchema()).filter(attr =>
        ownedIds.has(attr.id)
      );
      if (presentAttrs.length)
        await putSchema(presentAttrs.map(attr => ['delete-attr', attr.id]));
    }
    const users = manifest.fixtures.filter(f => f.entity === '$users');
    if (users.length) {
      const schema = await getSchema();
      const userLinks = Object.values(schema.refs).flatMap(attr =>
        [attr['forward-identity'], attr['reverse-identity']]
          .filter(identity => identity[1] === '$users')
          .map(identity => identity[2])
      );
      const query = {
        $users: {
          $: { where: { id: { $in: users.map(f => f.id) } } },
          ...Object.fromEntries(userLinks.map(label => [label, {}])),
        },
      };
      const found = (await db.query(query)).$users;
      for (const user of found) {
        const f = users.find(f => f.id === user.id);
        check(
          user.email === `${f.key}-${run}@gqc04.example.invalid`,
          'User ownership mismatch'
        );
        check(
          userLinks.every(label => !user[label]?.length),
          'User has unexpected cascade targets'
        );
        verifyTarget(process.env, '--test-app');
        await db.auth.deleteUser({ id: user.id });
      }
      check((await db.query(query)).$users.length === 0, 'Proof users remain');
    }
    if (manifest.rulesAttempted) await setRules({});
    if (manifest.originalRules)
      check(
        canonical(await getRules()) === canonical(manifest.originalRules),
        'Rules not restored'
      );
    if (manifest.originalSchema)
      check(
        canonical(schemaContract(await getSchema())) ===
          canonical(schemaContract(manifest.originalSchema)),
        'Schema not restored'
      );
    report.restoredRulesDigest = digest(await getRules());
    report.restoredSchemaDigest = digest(schemaContract(await getSchema()));
    report.cleanup =
      'verified-records-and-users-absent-schema-and-rules-restored';
    manifest.cleanup = report.cleanup;
  } catch (error) {
    failed = true;
    report.cleanup = 'FAILED-preserve-recovery-manifest';
    report.cleanupFailure = {
      category: error.name,
      detail:
        error.name === 'Error'
          ? error.message
          : 'SDK/API failure (raw details withheld)',
    };
  }
  report.finishedAt = new Date().toISOString();
  save();
  process.stdout.write(
    `${JSON.stringify({ run, boundedResult: report.boundedResult ?? 'NOT-PROVED', gate: report.gate, failure: report.failure, cleanup: report.cleanup, cleanupFailure: report.cleanupFailure, evidence: cleanupRun ? 'recovery-only-see-original-evidence' : `plans/grocery-quantity-contributions/evidence/gqc04-${run}.json` }, null, 2)}\n`
  );
  // Reactor timers survive shutdown. Never mask a failed experiment or cleanup.
  process.exit(failed ? 1 : 0);
}
