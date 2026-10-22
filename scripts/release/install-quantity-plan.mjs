import './load-typescript.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { init } from '@instantdb/admin';
import { TARGET_APP, canonical } from './backup.mjs';
const { materialize, totalFor, records } =
  await import('../../features/quantity/model.ts');
if (process.env.EXPO_PUBLIC_INSTANT_APP_ID !== TARGET_APP)
  throw Error('Approved dev destination only');
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (plan.failures.length) throw Error('Migration plan contains failures');
const folder = `backups/quantity-import/${plan.backupSha256}`;
const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`, 'utf8'));
const verified = JSON.parse(readFileSync(`${folder}/verified.json`, 'utf8'));
if (!verified.verified || manifest.targetAppId !== TARGET_APP)
  throw Error('Scalar restore must be verified first');
const db = init({
  appId: TARGET_APP,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
const before = await db.query({ gqc_workspaces_v1: {}, gqc_operations_v1: {} });
const workspaces = new Map(before.gqc_workspaces_v1.map(w => [w.id, w]));
const operations = new Map(before.gqc_operations_v1.map(o => [o.id, o]));
for (const p of plan.plans) {
  const existing = workspaces.get(p.listId);
  const expectedIds = new Set(p.operations.map(o => o.id));
  const existingHistory = before.gqc_operations_v1.filter(
    o => o.workspaceId === p.listId
  );
  if (
    existing &&
    (existing.appListId !== p.listId ||
      existingHistory.some(o => !expectedIds.has(o.id)))
  )
    throw Error(
      'Destination already has a different quantity history; keep it intact'
    );
  for (const operation of p.operations) {
    const row = operations.get(operation.id);
    if (
      row &&
      (row.workspaceId !== p.listId ||
        row.serialKey !== `${p.listId}:${operation.commit.sequence}` ||
        canonical(JSON.parse(row.body)) !== canonical(operation))
    )
      throw Error('Migration operation conflict');
  }
}
if (!process.argv.includes('--apply-to-dev')) {
  console.log(
    JSON.stringify({
      lists: plan.plans.length,
      existing: plan.plans.filter(p => workspaces.has(p.listId)).length,
      dryRun: true,
    })
  );
  process.exit(0);
}
for (const p of plan.plans) {
  const authorId = manifest.userMap[p.ownerId] ?? p.ownerId;
  const chunks = [];
  if (!workspaces.has(p.listId))
    chunks.push(
      db.tx.gqc_workspaces_v1[p.listId]
        .update({
          name: p.name,
          ownerId: authorId,
          memberIds: [authorId],
          appListId: p.listId,
        })
        .link({ groceryList: p.listId })
    );
  for (const operation of p.operations)
    if (!operations.has(operation.id))
      chunks.push(
        db.tx.gqc_operations_v1[operation.id]
          .update({
            workspaceId: p.listId,
            authorId,
            body: JSON.stringify(operation),
            serialKey: `${p.listId}:${operation.commit.sequence}`,
          })
          .link({ workspace: p.listId })
      );
  if (chunks.length) await db.transact(chunks);
}
const after = await db.query({ gqc_operations_v1: {} });
let rows = 0;
for (const p of plan.plans) {
  const stored = after.gqc_operations_v1
    .filter(o => o.workspaceId === p.listId)
    .map(o => JSON.parse(o.body));
  const actual = materialize(stored),
    expected = materialize(p.operations);
  if (
    !actual.complete ||
    actual.conflicts.length ||
    canonical(actual.documents) !== canonical(expected.documents)
  )
    throw Error('Quantity replay differs after restore');
  for (const row of records(actual, 'row')) {
    if (totalFor(actual, row.id) !== totalFor(expected, row.id))
      throw Error('Restored total differs');
    rows++;
  }
}
const result = {
  targetAppId: TARGET_APP,
  lists: plan.plans.length,
  rows,
  operations: plan.plans.reduce((n, p) => n + p.operations.length, 0),
  verified: true,
};
writeFileSync(
  `${folder}/quantity-verified.json`,
  JSON.stringify(result, null, 2) + '\n',
  { mode: 0o600 }
);
console.log(JSON.stringify(result));
