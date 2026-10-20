# Quantity workspace

A persistent iOS simulator implementation of the quantity attribution model. Open **Chomp → Settings → Quantity workspace**. The circular arrow starts a fresh Apples example, replacing this workspace's test groceries, recipes and meals. Its operation history remains saved.

This workspace uses real InstantDB persistence in the allowlisted development app. It is available only in development builds. The existing grocery, recipe and meal-plan screens still use the existing model; production migration and cutover are separate work.

## Try the approved example

1. Open Apples — **5 each** in Weekly shop: Apple pie **2**, Apple butter **1**, manual **2**. The separate **500 g** row cannot combine with it.
2. Tap Apple butter, then Remove. The total becomes **4**.
3. Tap Apple pie. It opens that meal's specific ingredient. Adjust it from **2** to **3** and return to Groceries: the total is **5**.
4. Add quantity in the item sheet. This adds an independent manual amount. Single manual quantities use the same Adjust quantity sheet.
5. In Recipes, add Apple butter again. Choose Keep separate or explicitly combine with a compatible row. Repeated adds remain independent snapshots. Recipe edits do not change them.
6. Move a mixed row to Weekend shop. Each amount survives separately, planned sources are deselected, and the destination amounts have no live meal-plan link.
7. Purchase a row, then change its meal quantity. The purchased total stays frozen; no unchecked difference appears. Clearing purchased history does not recreate it.

The Meal plan tab also supports standalone items, selection, date, meal type, servings and absolute ingredient overrides. Shopping name, notes, category and store edits do not change source metadata. Deleting an unchecked mixed row deselects every planned source in that row.

## Run locally

Use the existing `.env.local` for the development app. Do not copy an admin token into an Expo public variable. The setup script refuses any other app ID and requires `--test-app`.

```sh
pnpm quantity:setup
pnpm start --dev-client
# With the development build installed and a simulator booted:
xcrun simctl openurl booted chomp://quantity-workspace
```

If no native development build is installed, run `pnpm ios` first. Sign in or continue as a guest, then create the test workspace while connected. Test data persists across app restarts.

The setup script installs only `gqc_workspaces_v1` and `gqc_operations_v1`, checks their shape, and preserves unrelated schema/rules/data. Before changing anything it saves a private backup to ignored `tmp/quantity/setup-*.json`. Normal `instant.perms.ts` denies both namespaces; `quantity:setup` installs their development permissions explicitly. A generic permission push will disable the workspace until setup is rerun.

## Model and sync

- Rows own shopping metadata and purchase/delete state. Entries own amounts and source identity. Totals are derived, never stored.
- A complete workspace is a causal graph of immutable operations. Each operation contains all changes for one action, version preconditions, and guards for the entry sets used by purchase/delete/move. Replay is deterministic. Stale concurrent edits remain visible conflicts with the attempted changes available for review.
- Operations are strictly create-only on the server, including links. Exact retries read and compare the existing author, workspace and payload. This avoids both double counting and an observed unlink bypass in a `request.modifiedFields` guard.
- The app persists its outbox before showing a change. Rejected/uncertain changes remain available for retry. A full, unpaginated, freshly acknowledged workspace read is required before editing; a cached or missing-history result cannot authorize a destructive action.
- Once verified in a running session, offline edits are queued. A fresh offline launch waits for connection before enabling editing. Purchased/deleted source contributions satisfy their shopping cycle forever; schedule a new meal for another cycle. Removing a meal preserves historical quantities and detaches their live source IDs.
- A source unit change moves only its active contribution to a compatible new row. Other quantities and shopping metadata remain. Removing the last active source leaves a zero-quantity row available for manual additions or deletion.

## Verification

```sh
pnpm lint && pnpm tsc
pnpm lint:quantity
pnpm exec vitest run
pnpm test:quantity:sync
```

`lint:quantity` is explicit because Expo's default lint paths omit `features/`. The sync test requires the installed development namespaces and the private admin token; ordinary unit runs skip it. It creates synthetic members/workspaces, exercises actual authenticated SDK clients, and removes its own fixtures afterward. It does not change permissions while running.

The pure lifecycle suite covers quantities, metadata, source edits/removal, recipe snapshots, complete reads, concurrent edits/additions, purchase/delete/move races, malformed history and reset. The SDK evidence is in `plans/grocery-quantity-contributions/evidence/quantity-workspace-sdk.json`. It covers shared membership/revocation, create-only records and links, retries, source/manual races, complete reads, offline reconnect, frozen history and atomic move. Native observations are recorded separately alongside that evidence.

## Production boundary

This is the simulator-testing milestone, not completion of the production issues. Remaining release work includes integrating all existing application entry points, share/list-management UI, a resumable scalar-data migration with backup/restore validation, actual pre-feature-binary and updated-binary fence tests, Android/device QA, native process-death testing with pending offline edits, and the approved maintenance-window cutover. The SDK probe is not evidence of those missing binary tests.

The workspace reads its full operation history and uses simple test-screen lists. Before production, measure replay/rendering at expected list/history sizes and introduce verified snapshots/virtualization if needed. Do not prune causal history or revive scalar aggregate writes as a shortcut.
