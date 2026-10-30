# Quantity model

Contribution quantities are the production data model for grocery lists, recipes,
and meal plans. There is no quantity feature flag or scalar-writer fallback.
The former development Instant app `5df33e29-252b-4e1c-a111-53787beccba3` is now
production. Treat its credentials and data accordingly.

`app/provider.tsx` opens a durable session per accessible list and reconciles recipe
changes. Grocery and meal-plan hooks project operation history into the screen data
shapes. Initialization imports scalar rows only for lists without quantity history;
it also recovers saved-item links from earlier imports. Keep this upgrade support
and the legacy authentication restore for users who have not opened the update yet.

## Model and sync

- Rows own shopping metadata and purchase/delete state. Entries own amounts and source identity. Totals are derived, never stored.
- A complete workspace is a causal graph of immutable operations. Each operation contains all changes for one action, version preconditions, and guards for the entry sets used by purchase/delete/move. Replay is deterministic. Stale concurrent edits are skipped silently, preserving the accepted current state. Rejected operations remain in history for deterministic replay and internal validation; they do not require user review or block background recipe reconciliation.
- App writes use `serialKey = listId:sequence`, a unique server attribute. Persisted commit parents order accepted operations without changing the original intent's version guards. Multi-list actions prevalidate all halves, then atomically claim all slots; contention triggers a fresh read and revalidation. A later offline intent cannot reorder an accepted move. Missing slots or unsupported unsequenced writes fail closed. Older histories remain a fixed prefix.
- Recipe deletion queries the accessible list inventory, including unmounted lists, and atomically removes the catalog recipe with its list-side cleanup. Guards cover the full set of planned meals. Deleted-source markers prevent stale scheduling/reconciliation from reviving the recipe; purchased quantities detach their source and retain their amount. Direct recipe additions remain independent snapshots.
- Operations are strictly create-only on the server, including links. Exact retries read and compare the existing author, workspace and payload. This avoids both double counting and an observed unlink bypass in a `request.modifiedFields` guard.
- The app persists its outbox before publishing a model change. Grocery checkboxes show local optimistic feedback immediately; the action remains pending until its durable operation reaches the published model, without waiting for the server. Disk failures roll feedback back. Checkbox writes are serialized per list so rapid toggles use the preceding published version. Uncertain sync failures retain their durable outbox records. Sync errors and rejected edits do not display a conflict or retry panel. A full, unpaginated, freshly acknowledged workspace read is required before editing; a cached or missing-history result cannot authorize a destructive action.
- Once verified in a running session, offline edits are queued. A fresh offline launch waits for connection before enabling editing. Purchased/deleted source contributions satisfy their shopping cycle forever; schedule a new meal for another cycle. Removing a meal preserves historical quantities and detaches their live source IDs.
- A source unit change moves only its active contribution to a compatible new row. Other quantities and shopping metadata remain. Removing the last active source leaves a zero-quantity row available for manual additions or deletion.

## Development and verification

Use a separate Instant app for development. Deploy `instant.schema.ts` and
`instant.perms.ts` normally; no special setup script or demo route is required.
The checked-in permissions match the production snapshot taken during cleanup,
including deny-all rules for retired probe namespaces.

```sh
pnpm lint && pnpm tsc
pnpm lint:quantity
pnpm exec vitest run
```

`lint:quantity` is explicit because Expo's default lint paths omit `features/`.
Pure model and app-adapter tests run without database credentials. They cover
source edits, frozen history, selection, concurrency, saved-item synchronization,
retry behavior and cross-list moves.

For real SDK tests, create `.env.test.local` with `INSTANT_TEST_APP_ID`, the same
`EXPO_PUBLIC_INSTANT_APP_ID`, and that app's `INSTANT_APP_ADMIN_TOKEN`. Deploy the
normal schema and permissions to this separate app before running:

```sh
pnpm test:quantity:sync
```

The tests reject both current and former production apps before connecting. They
create synthetic users/lists and clean up their fixtures. Never use production
credentials. Run evidence is written under ignored `tmp/quantity-tests/`.

## Retired release tooling

The demo routes, example seeder, special schema installer, GQC proof scripts and
one-off cutover writers have been removed. Their source remains in Git history;
do not restore and run them against the promoted production database.

Historical design decisions and release evidence remain in
`plans/grocery-quantity-contributions/`. They describe the release at that time,
not current operational instructions. Keep ignored `backups/` and release tags
for recovery. OTA checks and publication verification remain active; see
`docs/releases.md`.

### Maintenance-branch commands

This OTA branch keeps `package.json` byte-for-byte equal to its native baseline.
Its old `quantity:setup` and demo lint script entries are retired. Use
`pnpm exec eslint features/quantity --max-warnings 0` for quantity lint. To run SDK
tests on the separate test app, use:

```sh
RUN_QUANTITY_SDK=1 node --env-file=.env.test.local node_modules/vitest/vitest.mjs run features/quantity/__tests__/instant-protocol.test.ts features/quantity/__tests__/app-permissions.test.ts features/quantity/__tests__/cross-list-sdk.test.ts
```
