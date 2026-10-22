// Narrow cutover reconciler: append-only legacy items/events and access timestamps.
// Reject any other production delta rather than overwrite newer quantity edits.
import './load-typescript.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { init } from '@instantdb/admin';
import {
  SOURCE_APP,
  TARGET_APP,
  readBackup,
  backupQuery,
  flattenQuery,
  normalizedRow,
  linksFor,
  canonical,
  digest,
} from './backup.mjs';
const { buildLegacyQuantityOperation } =
  await import('../../features/quantity/app/legacy-import.ts');
const { materialize, totalFor } =
  await import('../../features/quantity/model.ts');
const { QuantityTransaction } =
  await import('../../features/quantity/transaction.ts');
if (process.env.EXPO_PUBLIC_INSTANT_APP_ID !== TARGET_APP)
  throw Error('Approved dev destination only');
const baseline = readBackup(process.argv[2]);
const live = JSON.parse(readFileSync(process.argv[3], 'utf8'));
if (live.appId !== SOURCE_APP) throw Error('Wrong source');
const manifest = JSON.parse(
  readFileSync(
    `backups/quantity-import/${baseline.sha256}/manifest.json`,
    'utf8'
  )
);
const schema = baseline.config.schema;
const identity = { ...manifest.userMap, ...manifest.providerMap };
const remap = v =>
  typeof v === 'string'
    ? (identity[v] ?? v)
    : Array.isArray(v)
      ? v.map(remap)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remap(x)]))
        : v;
const additions = [];
const access = [];
for (const [name, rows] of Object.entries(baseline.tables)) {
  const current = new Map(live.tables[name].map(r => [r.id, r]));
  const old = new Map(rows.map(r => [r.id, r]));
  for (const row of rows) {
    if (!current.has(row.id))
      throw Error(`Source deletion requires explicit reconciliation: ${name}`);
    const a = normalizedRow(schema, name, row),
      b = normalizedRow(schema, name, current.get(row.id));
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (canonical(a[key]) === canonical(b[key])) continue;
      if (name === 'grocery_list_shares' && key === 'lastAccessedAt') {
        access.push(remap(b));
        continue;
      }
      if (
        name === 'grocery_lists' &&
        ['grocery_items', 'grocery_item_add_events'].includes(key)
      ) {
        if (a[key].some(id => !b[key].includes(id)))
          throw Error('Existing list edge removed');
        continue;
      }
      throw Error(
        `Source edit requires explicit reconciliation: ${name}.${key}`
      );
    }
  }
  for (const row of current.values())
    if (!old.has(row.id)) {
      if (!['grocery_items', 'grocery_item_add_events'].includes(name))
        throw Error(`Unsupported new namespace data: ${name}`);
      additions.push({ name, row: remap(row) });
    }
}
const db = init({
  appId: TARGET_APP,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
const query = {
  ...backupQuery(schema, Object.keys(baseline.tables)),
  gqc_workspaces_v1: {},
  gqc_operations_v1: {},
};
const before = await db.query(query);
const flat = flattenQuery(schema, before);
const folder = 'backups/production/live-cutover';
writeFileSync(
  `${folder}/target-before-reconcile.json`,
  JSON.stringify(before),
  { mode: 0o600 }
);
const chunks = [];
for (const { name, row } of additions) {
  const existing = flat[name].find(r => r.id === row.id);
  if (existing) {
    if (
      canonical(normalizedRow(schema, name, existing)) !==
      canonical(normalizedRow(schema, name, row))
    )
      throw Error('Destination addition conflict');
    continue;
  }
  const attrs = { ...row };
  delete attrs.id;
  for (const link of linksFor(schema, name)) delete attrs[link.label];
  chunks.push(db.tx[name][row.id].update(attrs));
  for (const link of linksFor(schema, name))
    if (
      row[link.label] != null &&
      (!Array.isArray(row[link.label]) || row[link.label].length)
    )
      chunks.push(db.tx[name][row.id].link({ [link.label]: row[link.label] }));
}
for (const row of access) {
  const existing = flat.grocery_list_shares.find(r => r.id === row.id);
  if (!existing) throw Error('Destination share deleted');
  if (
    !existing.lastAccessedAt ||
    Date.parse(row.lastAccessedAt) > Date.parse(existing.lastAccessedAt)
  )
    chunks.push(
      db.tx.grocery_list_shares[row.id].update({
        lastAccessedAt: row.lastAccessedAt,
      })
    );
}
const groups = new Map();
for (const { name, row } of additions)
  if (name === 'grocery_items') {
    const listId = row.grocery_list;
    if (!listId) throw Error('New item missing list');
    if (!groups.has(listId)) groups.set(listId, []);
    groups.get(listId).push(row);
  }
const checks = [];
for (const [listId, items] of groups) {
  items.sort((a, b) => a.id.localeCompare(b.id));
  const workspace = before.gqc_workspaces_v1.find(w => w.id === listId);
  if (!workspace) throw Error('Missing migrated workspace');
  const history = before.gqc_operations_v1
    .filter(o => o.workspaceId === listId)
    .map(o => JSON.parse(o.body));
  const state = materialize(history);
  if (!state.complete || state.conflicts.length)
    throw Error('Unresolved destination history');
  let counter = 0;
  const newId = () => {
    const h = createHash('sha256')
      .update(
        `late-additions:${listId}:${items.map(i => i.id).join(',')}:${counter++}`
      )
      .digest('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  };
  const converted = buildLegacyQuantityOperation(
    {
      id: listId,
      name: workspace.name,
      grocery_items: items.map(i => ({
        ...i,
        store: i.store ? { id: i.store } : null,
        saved_item: i.saved_item ? { id: i.saved_item } : null,
      })),
      meal_plan_items: [],
      meal_plan_recipes: [],
    },
    newId
  );
  const operationId = newId();
  if (history.some(o => o.id === operationId)) {
    checks.push(...items);
    continue;
  }
  const tx = new QuantityTransaction(state);
  for (const change of converted.changes) {
    if (change.value.kind === 'list') continue;
    if (state.documents[change.id])
      throw Error('New item already exists in quantity history');
    tx.put(change.value);
  }
  const operation = {
    ...tx.build(operationId, 'Import late production items'),
    commit: {
      sequence: Math.max(0, ...history.map(o => o.commit.sequence)) + 1,
      parents: state.heads,
    },
  };
  const expected = materialize([...history, operation]);
  if (!expected.complete || expected.conflicts.length)
    throw Error('Invalid appended history');
  for (const item of items)
    if (totalFor(expected, item.id) !== item.quantity)
      throw Error('Quantity mismatch');
  chunks.push(
    db.tx.gqc_operations_v1[operation.id]
      .update({
        workspaceId: listId,
        authorId: workspace.ownerId,
        body: JSON.stringify(operation),
        serialKey: `${listId}:${operation.commit.sequence}`,
      })
      .link({ workspace: listId })
  );
  checks.push(...items);
}
const summary = {
  sourceCapturedAt: live.capturedAt,
  additions: additions.length,
  newItems: checks.length,
  lists: groups.size,
  accessTimes: access.length,
  transactions: chunks.length,
};
console.log(
  JSON.stringify({ ...summary, apply: process.argv.includes('--apply-to-dev') })
);
if (!process.argv.includes('--apply-to-dev')) process.exit(0);
if (digest(await db.query(query)) !== digest(before))
  throw Error('Destination changed during preflight; retry');
if (chunks.length) await db.transact(chunks);
const after = await db.query(query);
const normalized = flattenQuery(schema, after);
for (const { name, row } of additions) {
  const actual = normalized[name].find(r => r.id === row.id);
  if (
    !actual ||
    canonical(normalizedRow(schema, name, actual)) !==
      canonical(normalizedRow(schema, name, row))
  )
    throw Error('Added legacy data verification failed');
}
for (const [listId, items] of groups) {
  const state = materialize(
    after.gqc_operations_v1
      .filter(o => o.workspaceId === listId)
      .map(o => JSON.parse(o.body))
  );
  if (!state.complete || state.conflicts.length)
    throw Error('Replay verification failed');
  for (const item of items)
    if (totalFor(state, item.id) !== item.quantity)
      throw Error('Quantity verification failed');
}
for (const op of before.gqc_operations_v1) {
  const actual = after.gqc_operations_v1.find(o => o.id === op.id);
  if (canonical(actual) !== canonical(op))
    throw Error('Existing history changed');
}
writeFileSync(
  `${folder}/reconciled.json`,
  JSON.stringify({ ...summary, verified: true }, null, 2),
  { mode: 0o600 }
);
console.log('Reconciliation verified; existing quantity history preserved.');
