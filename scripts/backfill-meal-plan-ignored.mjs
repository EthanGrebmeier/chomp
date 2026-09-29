/**
 * One-off migration for live meal plan ↔ grocery list sync (MPS-02, #12).
 *
 * Marks every existing `meal_plan_recipes` and `meal_plan_items` row as
 * `ignoredByGroceryList: true` ("meal plan only"), so shipping live sync does
 * not flood existing grocery lists with ingredients from old entries. Only
 * meal plan entries are written; grocery items are never touched.
 *
 * The script is idempotent: rows that are already ignored are skipped, so a
 * re-run reports zero pending updates and writes nothing.
 *
 * Requirements (read from the environment, e.g. `.env.local`):
 *   EXPO_PUBLIC_INSTANT_APP_ID  Instant app id to migrate
 *   INSTANT_APP_ADMIN_TOKEN     Admin token for that app
 *
 * Usage:
 *   # Preview: print counts without writing anything
 *   node --env-file=.env.local scripts/backfill-meal-plan-ignored.mjs --dry-run
 *
 *   # Apply the migration
 *   node --env-file=.env.local scripts/backfill-meal-plan-ignored.mjs
 *
 * Point the env vars at a dev app first, then re-run against production once
 * the dry run's counts look right.
 */
import { init } from '@instantdb/admin';

const ENTITIES = ['meal_plan_recipes', 'meal_plan_items'];
const PAGE_SIZE = 500;
const BATCH_SIZE = 100;

const dryRun = process.argv.includes('--dry-run');

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!appId || !adminToken) {
  console.error(
    'Missing EXPO_PUBLIC_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN. ' +
      'Run with `node --env-file=.env.local scripts/backfill-meal-plan-ignored.mjs`.'
  );
  process.exit(1);
}

const db = init({ appId, adminToken });

/** Reads every row of `entity`, fetching only the fields this script needs. */
async function fetchAllRows(entity) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await db.query({
      [entity]: {
        $: {
          limit: PAGE_SIZE,
          offset,
          fields: ['ignoredByGroceryList'],
        },
      },
    });
    const page = result[entity] ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function backfillEntity(entity) {
  const rows = await fetchAllRows(entity);
  const pending = rows.filter(row => row.ignoredByGroceryList !== true);

  console.log(
    `${entity}: ${rows.length} total, ${rows.length - pending.length} already ignored, ` +
      `${pending.length} to update`
  );

  if (dryRun || pending.length === 0) return pending.length;

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);
    await db.transact(
      batch.map(row =>
        db.tx[entity][row.id].update({ ignoredByGroceryList: true })
      )
    );
    console.log(
      `${entity}: updated ${Math.min(start + BATCH_SIZE, pending.length)}/${pending.length}`
    );
  }

  return pending.length;
}

async function main() {
  console.log(
    `${dryRun ? '[dry run] ' : ''}Backfilling ignoredByGroceryList on app ${appId}`
  );

  let totalPending = 0;
  for (const entity of ENTITIES) {
    totalPending += await backfillEntity(entity);
  }

  console.log(
    dryRun
      ? `[dry run] ${totalPending} rows would be updated. Nothing was written.`
      : `Done. ${totalPending} rows updated.`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
