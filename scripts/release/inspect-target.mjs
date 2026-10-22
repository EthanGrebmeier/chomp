// Read-only inventory. Sensitive target records are written only to the ignored backup directory.
import { mkdirSync, writeFileSync } from 'node:fs';
import { init } from '@instantdb/admin';
import {
  TARGET_APP,
  readBackup,
  backupQuery,
  flattenQuery,
  canonical,
  normalizedRow,
} from './backup.mjs';
if (process.env.EXPO_PUBLIC_INSTANT_APP_ID !== TARGET_APP)
  throw Error('Requires the approved dev target');
const source = readBackup(process.argv[2]);
const db = init({
  appId: TARGET_APP,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
const data = flattenQuery(
  source.config.schema,
  await db.query(backupQuery(source.config.schema, Object.keys(source.tables)))
);
mkdirSync('backups/quantity-target', { recursive: true, mode: 0o700 });
writeFileSync(
  `backups/quantity-target/live-${Date.now()}.json`,
  JSON.stringify(data),
  { mode: 0o600, flag: 'wx' }
);
for (const [name, rows] of Object.entries(source.tables)) {
  const existing = new Map(data[name].map(x => [x.id, x]));
  let overlap = 0,
    changed = 0;
  for (const row of rows) {
    const target = existing.get(row.id);
    if (target) {
      overlap++;
      if (
        canonical(normalizedRow(source.config.schema, name, row)) !==
        canonical(normalizedRow(source.config.schema, name, target))
      )
        changed++;
    }
  }
  console.log(
    JSON.stringify({
      namespace: name,
      source: rows.length,
      target: data[name].length,
      overlap,
      changed,
    })
  );
}
