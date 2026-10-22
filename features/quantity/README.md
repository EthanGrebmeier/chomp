# Quantity model

The existing Chomp grocery-list, recipe and meal-plan screens use the contribution model automatically in development builds connected to InstantDB app `5df33e29-252b-4e1c-a111-53787beccba3`. Continue as a guest; use the normal app navigation. No workspace setup or separate route is needed inside the app.

## Actual app integration

- Every real grocery list has its own immutable operation history, keyed by the existing list ID. Access follows the list's live membership. Joining and leaving use the existing list UI. A scalar `appListId` marker makes an app scope immutable, including its permission link.
- `app/provider.tsx` opens one durable quantity session per accessible list. Existing grocery and meal-plan hooks project that history into the established screen data shapes. The scalar meal-plan reconciler is disabled for these development sessions.
- Manual/saved/recent adds, recipe adds, planned recipes and standalone items, selection and overrides, purchase/delete/clear, bulk metadata edits, recipe changes and source deletion use contributions. A grocery total cannot be edited directly. Direct item, recipe and meal-plan additions automatically combine matching names, units and stores. Only matching-unit items at different stores open the store review, with keep-separate or either-store choices. Different units stay separate; purchased/deleted rows are ignored. Review is rechecked against current list data before saving.
- The normal item sheet shows each contribution. Planned amounts open the normal meal-plan editor focused on the specific source ingredient. Shopping metadata does not write back to a recipe or planned source. Direct recipe amounts remain independent snapshots.
- Saved-item additions retain their saved-item link. Item-sheet and bulk edits sync name, notes, category and store to the linked saved item only for its owner; quantities never sync back. Combining retains the destination row's existing link. The durable outbox retries failed saved-item updates after the quantity edit is accepted. Earlier development imports recover links by original row ID; additions that already discarded their link cannot be safely reconstructed by name.
- Existing scalar rows are copied once as ordinary manual amounts, including purchased/deleted history. Original records remain untouched as a backup. Existing meals are retained with shopping selection off so their already-imported scalar amounts are not counted twice. This development import is not the production migration.
- Moving items preserves their individual amounts and deselects live sources. Cross-list moves and recipe deletion require a connection and an empty outbox. They validate every affected list and claim the next unique commit slot in each list in one database transaction; a racing edit either survives with the whole action rejected, or becomes a visible conflict after the action commits.
- Initialization, outbox failures and causal conflicts are visible on the normal grocery screen, with retry/keep-current controls. Operations are never silently converted back into scalar quantities.

## Try it in the simulator

The current simulator guest has a normal **Quantity test** grocery list with the Apples example and two ordinary recipes, **Apple pie** and **Apple butter**. Open that list from Grocery Lists. The original Shopping List remains available.

For a new guest, add your own items/recipes normally. Optionally create an empty list called **Quantity test** and run the fixture command below once. It refuses non-guest, non-empty, ambiguous or already-seeded lists; it does not reset data.

```sh
pnpm quantity:setup
pnpm start --dev-client
# Optional fixture after creating the empty list in the actual app:
node --env-file=.env.local scripts/quantity/seed-app-example.mjs --test-app
```

## Try the approved example

1. Open Apples — **5 each** in Quantity test: Apple pie **2**, Apple butter **1**, manual **2**. The separate **500 g** row cannot combine with it.
2. Tap Apple butter, then Remove. The total becomes **4**.
3. Tap Apple pie. It opens that meal's specific ingredient. Adjust it from **2** to **3** and return to Groceries: the total is **5**.
4. Add quantity in the item sheet. This adds an independent manual amount. Single manual quantities use the same Adjust quantity sheet.
5. In the normal Recipes screen or Add item → Recipe, add Apple butter again. Matching names, units and stores combine automatically. If only other stores match, choose Keep separate or combine at either store. Repeated adds remain independent snapshots. Recipe edits do not change them.
6. Move a mixed row to another real grocery list (while connected and synced). Each amount survives separately, planned sources are deselected, and the destination amounts have no live meal-plan link.
7. Purchase a row, then change its meal quantity. The purchased total stays frozen; no unchecked difference appears. Clearing purchased history does not recreate it.

The normal Meal Plan view also supports standalone items, selection, date, meal type, servings and absolute ingredient overrides. Shopping name, notes, category and store edits do not change source metadata. Deleting an unchecked mixed row deselects every planned source in that row.

## Development setup

Use the existing `.env.local`. Never put an admin token in an Expo public variable. The setup script refuses other app IDs and requires `--test-app`; it backs up schema/rules under ignored `tmp/quantity/` before modifying the development quantity namespaces. Unrelated rules and data are preserved. The ordinary `instant.perms.ts` continues denying the quantity namespaces, so a generic permission push requires rerunning `quantity:setup` for this dev integration.

If no native development build is installed, run `pnpm ios`. The older Settings → Quantity workspace route remains an optional model demo; it is not the application's data source. Its reset affects only the demo.

## Model and sync

- Rows own shopping metadata and purchase/delete state. Entries own amounts and source identity. Totals are derived, never stored.
- A complete workspace is a causal graph of immutable operations. Each operation contains all changes for one action, version preconditions, and guards for the entry sets used by purchase/delete/move. Replay is deterministic. Stale concurrent edits remain visible conflicts with the attempted changes available for review.
- App writes use `serialKey = listId:sequence`, a unique server attribute. Persisted commit parents order accepted operations without changing the original intent's version guards. Multi-list actions prevalidate all halves, then atomically claim all slots; contention triggers a fresh read and revalidation. A later offline intent cannot reorder an accepted move. Missing slots or unsupported unsequenced writes fail closed. Older histories remain a fixed prefix; rerun `quantity:setup` before using this version in development.
- Recipe deletion queries the accessible list inventory, including unmounted lists, and atomically removes the catalog recipe with its list-side cleanup. Guards cover the full set of planned meals. Deleted-source markers prevent stale scheduling/reconciliation from reviving the recipe; purchased quantities detach their source and retain their amount. Direct recipe additions remain independent snapshots.
- Operations are strictly create-only on the server, including links. Exact retries read and compare the existing author, workspace and payload. This avoids both double counting and an observed unlink bypass in a `request.modifiedFields` guard.
- The app persists its outbox before publishing a model change. Grocery checkboxes show local optimistic feedback immediately; the action remains pending until its durable operation reaches the published model, without waiting for the server. Disk failures roll feedback back. Checkbox writes are serialized per list so rapid toggles use the preceding published version. Rejected/uncertain changes remain available for retry. A full, unpaginated, freshly acknowledged workspace read is required before editing; a cached or missing-history result cannot authorize a destructive action.
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

The app-adapter suite covers real-screen data projections, direct recipe snapshots, source overrides, decimal standalone items, mixed deletion, unit separation and purchased history. The guest SDK suite exercises real list creation, join-by-code, membership revocation and immutable list scope links.

The pure lifecycle suite covers quantities, metadata, source edits/removal, recipe snapshots, complete reads, concurrent edits/additions, purchase/delete/move races, malformed history and reset. The SDK evidence is in `plans/grocery-quantity-contributions/evidence/quantity-workspace-sdk.json`. It covers shared membership/revocation, create-only records and links, retries, source/manual races, complete reads, offline reconnect, frozen history and atomic move. Native observations are recorded separately alongside that evidence.

`plans/grocery-quantity-contributions/evidence/cross-list-sdk.json` records the separate two-client proof for slot contention, whole-move rejection, stale-intent replay, membership revocation, scoped slot permissions, and atomic recipe deletion. App-adapter tests exercise mixed amounts, saved-item links, source deselection and unmounted-list discovery. These development tests do not replace the old-binary production fence.

## Production boundary

This is the simulator-testing milestone, not completion of the production issues. Remaining release work includes a resumable production scalar-data migration with backup/restore validation, actual pre-feature-binary and updated-binary fence tests, Android/device QA, native process-death testing with pending offline edits, and the approved maintenance-window cutover. The SDK probe is not evidence of those missing binary tests.

Each list reads its full operation history. The main app retains its existing virtualized grocery and meal-plan views; the optional demo uses simple lists. Before production, measure replay/rendering at expected list/history sizes and introduce verified snapshots/virtualization if needed. Do not prune causal history or revive scalar aggregate writes as a shortcut.

Checkbox timing measurements and fault-injection results are recorded in `plans/grocery-quantity-contributions/evidence/checkbox-latency.json`. These are development simulator measurements, not production-device benchmarks.
