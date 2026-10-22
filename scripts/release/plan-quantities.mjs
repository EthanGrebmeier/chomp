// Offline only: never connects to either database.
import './load-typescript.mjs';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { readBackup, linksFor, digest } from './backup.mjs';
const { buildLegacyQuantityOperation } =
  await import('../../features/quantity/app/legacy-import.ts');
const { materialize, records, totalFor } =
  await import('../../features/quantity/model.ts');
const { QuantityTransaction } =
  await import('../../features/quantity/transaction.ts');
const backup = readBackup(process.argv[2]);
const out = process.argv[3];
if (!out?.startsWith('backups/'))
  throw Error('Output must stay in ignored backups/');
const indexes = Object.fromEntries(
  Object.entries(backup.tables).map(([k, rows]) => [
    k,
    new Map(rows.map(row => [row.id, row])),
  ])
);
function hydrate(namespace, row, shape) {
  const result = { ...row };
  for (const [label, children] of Object.entries(shape)) {
    const link = linksFor(backup.config.schema, namespace).find(
      l => l.label === label
    );
    if (!link) throw Error(`Missing schema link ${namespace}.${label}`);
    const linked = [row[label] ?? []].flat().map(id => {
      const entity = indexes[link.target]?.get(id);
      if (!entity) throw Error('Missing linked row');
      return hydrate(link.target, entity, children);
    });
    linked.sort((a, b) => a.id.localeCompare(b.id));
    result[label] = link.has === 'many' ? linked : (linked[0] ?? null);
  }
  return result;
}
const shape = {
  grocery_items: { store: {}, saved_item: {} },
  meal_plan_items: { store: {} },
  meal_plan_recipes: {
    recipe: { recipe_ingredients: { store: {} } },
    ingredient_snapshots: { store: {} },
  },
};
const plans = [];
const failures = [];
const started = performance.now();
for (const raw of [...backup.tables.grocery_lists].sort((a, b) =>
  a.id.localeCompare(b.id)
)) {
  try {
    const list = hydrate('grocery_lists', raw, shape);
    let counter = 0;
    const newId = () => {
      const h = createHash('sha256')
        .update(`chomp-quantity-v1:${raw.id}:${counter++}`)
        .digest('hex');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
    };
    const genesis = buildLegacyQuantityOperation(list, newId);
    // Keep immutable operation bodies under the server's 200,000-character limit.
    // Each prefix is validated, and the whole plan is installed before reopening writes.
    const operations = [];
    let state = materialize([]);
    let tx = new QuantityTransaction(state);
    let bytes = 0;
    const flush = () => {
      if (!bytes) return;
      const operation = {
        ...tx.build(newId(), 'Migrate list quantities'),
        commit: { sequence: operations.length + 1, parents: state.heads },
      };
      if (Buffer.byteLength(JSON.stringify(operation)) >= 190000)
        throw Error('A document exceeds the operation size limit');
      operations.push(operation);
      state = materialize(operations);
      if (!state.complete || state.conflicts.length)
        throw Error('Invalid migration replay');
      tx = new QuantityTransaction(state);
      bytes = 0;
    };
    for (const change of genesis.changes) {
      const size = Buffer.byteLength(JSON.stringify(change));
      if (bytes + size > 170000) flush();
      tx.put(change.value);
      bytes += size;
    }
    flush();
    const rows = records(state, 'row');
    if (rows.length !== list.grocery_items.length)
      throw Error('Row count changed');
    for (const item of list.grocery_items) {
      const row = state.documents[item.id];
      if (totalFor(state, item.id) !== item.quantity)
        throw Error('Scalar total cannot be preserved exactly');
      if (row.savedItemId !== (item.saved_item?.id ?? undefined))
        throw Error('Saved-item association changed');
      if (
        row.status !==
        (item.isDeleted ? 'deleted' : item.isChecked ? 'checked' : 'active')
      )
        throw Error('History status changed');
    }
    if (
      records(state, 'meal').length !==
      list.meal_plan_items.length + list.meal_plan_recipes.length
    )
      throw Error('A planned recipe has no source recipe');
    plans.push({
      listId: raw.id,
      ownerId: raw.ownerId,
      name: raw.name,
      operations,
      rows: rows.length,
      entries: records(state, 'entry').length,
      meals: records(state, 'meal').length,
    });
  } catch (error) {
    failures.push({ listId: raw.id, error: error.message });
  }
}
mkdirSync(out, { recursive: true, mode: 0o700 });
const plan = {
  sourceAppId: backup.config.appId,
  backupSha256: backup.sha256,
  backupAt: backup.config.backupAt,
  plans,
  failures,
};
writeFileSync(`${out}/quantity-plan.json`, JSON.stringify(plan), {
  mode: 0o600,
});
const summary = {
  lists: plans.length,
  rows: plans.reduce((n, p) => n + p.rows, 0),
  operations: plans.reduce((n, p) => n + p.operations.length, 0),
  failures: failures.length,
  planSha256: digest(plan),
  elapsedMs: Math.round(performance.now() - started),
};
writeFileSync(`${out}/summary.json`, JSON.stringify(summary, null, 2) + '\n', {
  mode: 0o600,
});
console.log(JSON.stringify(summary));
if (failures.length) process.exitCode = 1;
