// Rehearsal/import only. Hard-locked to the owner-approved dev destination.
// No deletes, no production writes, and no mutation until the complete preflight passes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { init } from '@instantdb/admin';
import {
  TARGET_APP,
  readBackup,
  backupQuery,
  flattenQuery,
  linksFor,
  canonical,
  normalizedRow,
  digest,
} from './backup.mjs';
if (process.env.EXPO_PUBLIC_INSTANT_APP_ID !== TARGET_APP)
  throw Error('Requires the approved dev destination');
const source = readBackup(process.argv[2]);
const verifyOnly = process.argv.includes('--verify-only');
const apply = process.argv.includes('--apply-to-dev') || verifyOnly;
const db = init({
  appId: TARGET_APP,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
const schema = source.config.schema;
const query = backupQuery(schema, Object.keys(source.tables));
const before = flattenQuery(schema, await db.query(query));
const folder = `backups/quantity-import/${source.sha256}`;
mkdirSync(folder, { recursive: true, mode: 0o700 });
const manifestPath = `${folder}/manifest.json`;
const previous = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : null;
if (verifyOnly && !previous) throw Error('No import manifest to verify');
if (previous && previous.targetAppId !== TARGET_APP)
  throw Error('Manifest target mismatch');
const userMap = previous?.userMap ?? {};
const emails = new Map(
  before.$users.filter(u => u.email).map(u => [u.email.toLowerCase(), u])
);
if (!previous)
  for (const user of source.tables.$users) {
    const match = user.email && emails.get(user.email.toLowerCase());
    if (match && match.id !== user.id) userMap[user.id] = match.id;
  }
const providerMap = previous?.providerMap ?? {};
for (const provider of source.tables.$oauthProviders ?? []) {
  const match = before.$oauthProviders.find(p => p.name === provider.name);
  if (match && match.id !== provider.id) providerMap[provider.id] = match.id;
}
const identityMap = { ...userMap, ...providerMap };
function remap(value) {
  if (typeof value === 'string') return identityMap[value] ?? value;
  if (Array.isArray(value)) return value.map(remap);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, remap(v)])
    );
  return value;
}
const tables = remap(source.tables);
for (const row of tables.$oauthUserLinks ?? [])
  if (row['sub+$oauthProvider'])
    for (const [oldId, newId] of Object.entries(providerMap))
      row['sub+$oauthProvider'] = row['sub+$oauthProvider'].replace(
        oldId,
        newId
      );
const mappedProviders = new Set(Object.values(providerMap));
const mappedIds = new Set(Object.values(userMap));
const originalIds =
  previous?.originalIds ??
  Object.fromEntries(
    Object.entries(before).map(([name, rows]) => [name, rows.map(r => r.id)])
  );
const isMappedUser = (name, row) =>
  (name === '$users' && mappedIds.has(row.id)) ||
  (name === '$oauthProviders' && mappedProviders.has(row.id));
const scalar = (name, row) => {
  const value = { ...row };
  delete value.id;
  for (const link of linksFor(schema, name)) delete value[link.label];
  return value;
};
function assertCompatible(name, expected, actual, allowMissing) {
  const a = normalizedRow(schema, name, actual),
    e = normalizedRow(schema, name, expected);
  for (const [key, value] of Object.entries(a)) {
    if (value == null || (Array.isArray(value) && !value.length)) continue;
    if (
      allowMissing &&
      name === '$oauthClients' &&
      key === '$oauthProvider' &&
      providerMap[value] === e[key]
    )
      continue;
    if (canonical(value) !== canonical(e[key]))
      throw Error(
        `Destination conflict in ${name}.${key}; no overwrite permitted`
      );
  }
  if (!allowMissing)
    for (const [key, value] of Object.entries(e)) {
      if (value == null || (Array.isArray(value) && !value.length)) continue;
      if (canonical(value) !== canonical(a[key]))
        throw Error(`Incomplete destination record in ${name}.${key}`);
    }
}
let inserts = 0,
  existing = 0;
for (const [name, rows] of Object.entries(tables)) {
  const index = new Map(before[name].map(r => [r.id, r]));
  for (const row of rows) {
    const actual = index.get(row.id);
    if (isMappedUser(name, row)) {
      if (
        !actual ||
        (name === '$users'
          ? actual.email?.toLowerCase() !== row.email?.toLowerCase()
          : actual.name !== row.name)
      )
        throw Error('Mapped identity changed');
      continue;
    }
    if (actual) {
      assertCompatible(
        name,
        row,
        actual,
        !!previous && !originalIds[name].includes(row.id)
      );
      existing++;
    } else inserts++;
  }
  // Check unique fields before any batch writes, including provider/client collisions.
  for (const [field, attr] of Object.entries(
    schema.entities[name]?.attrs ?? {}
  ))
    if (attr.config?.unique) {
      const values = new Map(
        before[name]
          .filter(r => r[field] != null)
          .map(r => [canonical(r[field]), r.id])
      );
      for (const row of rows)
        if (row[field] != null) {
          const found = values.get(canonical(row[field]));
          if (found && found !== row.id)
            throw Error(`Unique value collision: ${name}.${field}`);
        }
    }
}
const summary = {
  targetAppId: TARGET_APP,
  backupSha256: source.sha256,
  inserts,
  existing,
  mappedUsers: Object.keys(userMap).length,
  applied: false,
};
if (!apply) {
  console.log(JSON.stringify(summary));
  process.exit(0);
}
if (!previous) {
  writeFileSync(`${folder}/target-before.json`, JSON.stringify(before), {
    mode: 0o600,
    flag: 'wx',
  });
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        targetAppId: TARGET_APP,
        sourceSha256: source.sha256,
        userMap,
        providerMap,
        originalIds,
        beforeDigest: digest(before),
      },
      null,
      2
    ),
    { mode: 0o600, flag: 'wx' }
  );
}
if (previous && !previous.providerMap)
  writeFileSync(
    manifestPath,
    JSON.stringify({ ...previous, providerMap }, null, 2),
    { mode: 0o600 }
  );
const flush = async chunks => {
  for (let i = 0; i < chunks.length; i += 200)
    await db.transact(chunks.slice(i, i + 200));
};
// Attribute records first, then links, so all endpoints exist. Never copy permission rules.
if (!verifyOnly)
  for (const [name, rows] of Object.entries(tables)) {
    const index = new Map(before[name].map(r => [r.id, r]));
    await flush(
      rows
        .filter(
          row =>
            !isMappedUser(name, row) &&
            (!index.has(row.id) || !originalIds[name].includes(row.id))
        )
        .map(row => db.tx[name][row.id].update(scalar(name, row)))
    );
    console.log(`Imported attributes: ${name} (${rows.length})`);
  }
// Emit each edge once, from its forward side. Rerunning link is idempotent.
if (!verifyOnly)
  for (const { forward } of Object.values(schema.links)) {
    const chunks = [];
    for (const row of tables[forward.on] ?? []) {
      const value = row[forward.label];
      if (value != null && (!Array.isArray(value) || value.length))
        chunks.push(db.tx[forward.on][row.id].link({ [forward.label]: value }));
    }
    await flush(chunks);
  }
const after = flattenQuery(schema, await db.query(query));
for (const [name, rows] of Object.entries(tables)) {
  const index = new Map(after[name].map(row => [row.id, row]));
  for (const row of rows) {
    if (isMappedUser(name, row)) continue;
    const actual = index.get(row.id);
    if (!actual) throw Error(`Missing restored record: ${name}`);
    assertCompatible(name, row, actual, false);
  }
}
// Original dev scalars must remain intact. Their reverse links may gain imported records.
const original = JSON.parse(
  readFileSync(`${folder}/target-before.json`, 'utf8')
);
for (const [name, rows] of Object.entries(original)) {
  const index = new Map(after[name].map(r => [r.id, r]));
  for (const row of rows) {
    const actual = index.get(row.id);
    if (
      !actual ||
      canonical(scalar(name, row)) !== canonical(scalar(name, actual))
    )
      throw Error(`Existing dev record changed: ${name}`);
  }
}
summary.applied = true;
summary.verified = true;
writeFileSync(
  `${folder}/verified.json`,
  JSON.stringify(summary, null, 2) + '\n',
  { mode: 0o600 }
);
console.log(JSON.stringify(summary));
