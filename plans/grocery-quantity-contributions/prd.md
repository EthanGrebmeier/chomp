# Grocery quantity contributions

Status: planning; no production enablement authorized by this document.

**Simulator implementation:** A persistent development-only [Quantity workspace](../../features/quantity/README.md) now exercises the confirmed behavior with immutable operations, derived totals, visible conflicts, and a durable outbox. Its [SDK evidence](evidence/quantity-workspace-sdk.json) is separate from the prior failed protocol. This is an isolated simulator-testing milestone; the existing app writers, production migration, actual old-binary fence, and cutover gates below remain outstanding.

## Goal

Represent a grocery row as a shopping item containing independently identified quantity entries. A row may contain quantities from multiple scheduled meals, direct recipe additions, and manual additions. Keep the grocery list compact while making its quantity explainable in the edit sheet. Manual/direct-recipe quantities are edited there; planned quantities link to their specific item in the meal plan for editing.

## Confirmed product decisions

- A grocery item can contain multiple separately identified quantity entries.
- Entries can originate from scheduled recipe ingredients, standalone planned items, direct recipe additions, or manual additions.
- Adding extra quantity creates a separate manual entry; it does not overwrite a meal's quantity.
- The combined total is calculated and read-only. Manual/direct-recipe entries can be edited in the grocery sheet; planned entries link to the focused item in the meal plan for quantity editing or individual deselection.
- There is no individual planned-entry removal action in the grocery sheet. Deleting an entire unchecked grocery row deselects **each** scheduled recipe ingredient in that row and ignores any standalone planned item in that row, preventing sync from recreating their contributions. Deleting/clearing purchased history leaves the meal plan alone.
- Roll out with a one-time production cutover and required client update, not a permanent legacy adapter, shadow mode, or old/new write bridge. Old client versions do not retain editing access after cutover.
- The isolated quantity-contributions demo (#41) is the approved visual target for the Edit Item quantity breakdown, building on the compact duplicate-resolution sheet and existing item-sheet conventions. Production integration and native device QA remain separate work.

## Example

Apples — 5 each

- Apple pie, Friday dinner — 2 each
- Apple butter, added from recipe — 1 each
- Extra apples, added manually — 2 each
- Add quantity

Removing Apple butter leaves 4 apples. If the pie entry is then changed from 2 to 3 in Friday's focused planned meal, its active shopping contribution updates to 3, making 5 apples. Deleting the **whole unchecked Apples row** also deselects the pie ingredient in that meal.

## Confirmed contribution behavior (GQC-02)

Product-owner decisions and the existing-write-path review are recorded in [the GQC-02 decision and writer map](gqc-02-decision-and-writer-map.md). These decisions supersede earlier _proposed_ defaults and the simulated demo's all-entries-open-an-editor behavior, but do not authorize production activation.

- Scheduled recipe ingredients and standalone planned items are navigable links to their **specific focused** meal-plan item. Their quantities and individual selection are edited in the meal plan, not written back from the grocery sheet. A grocery row's whole-item delete remains an explicit exception and applies to all its active planned sources. The one-to-one source↔grocery-row invariant from the live meal-plan PRD (#10) must be replaced with one active source↔entry, not layered on top of grouped rows.
- Direct recipe adds capture independent per-add ingredient snapshots. Editing their grocery quantity does not edit the recipe; later recipe edits do not change past additions. Repeated adds remain separate entries.
- Manual entries are independent. At cutover, existing scalar quantities appear as ordinary editable raw entries with **no required “Existing quantity” or “unattributed” label**. Never fabricate recipe allocations from a scalar total. Unknown origin may be stored internally.
- The grocery row owns shopping name, category, store, checked/deleted status, and general shopping notes. Entries preserve source identity and source labels/notes. Shopping metadata edits do not fan out to recipe or meal sources.
- One row has one unit. Compare name/unit after trimming, case-folding and collapsing whitespace; do not infer aliases or convert units. Different-unit items remain separate; the earlier duplicate-resolution demo's “Set a combined total” option must **not** ship. Differences in notes/category do not block combining: retain the existing row's shopping metadata and each entry's source details.
- For matching-unit items at different stores, offer “keep separate” by default, or explicitly combine at either store. The chosen store belongs to the resulting shopping row; source stores are not rewritten.
- Even a single manual quantity is a tappable row opening **Adjust quantity**; direct-recipe quantities are editable there too. Planned rows must look like navigation links instead of editable amounts. The aggregate is never directly editable.
- Checked/deleted items are history and never duplicate targets. If a meal's amount increases after its row is checked, keep the purchased quantity unchanged and do **not** create an unchecked difference. Clearing purchased history does not resurrect it.
- Moving an unchecked mixed row to another list has the same source-list deselection/ignore effect as deleting it. The destination has **separate ordinary quantities**, preserving the total and direct-recipe source snapshots but no live link to the original meal plan. Do not collapse the amounts into one unexplained total.

The #41 demo remains an approved **visual direction**, not a behavior or persistence authority where these decisions differ. Update its meal-plan affordances for production. Native iOS/Android QA is outstanding (#50).

## Rollout decision: one-time cutover

The production rollout may require the few existing users to install a new client. A short, announced maintenance window is acceptable. An old client that queued edits while offline may have those edits rejected on reconnection; preserving or replaying those edits is **not** a release requirement. Communicate this limitation and the update requirement before cutover. This approval does not extend to losing edits made by updated clients.

Keep the existing InstantDB app if an enforceable permission boundary can be demonstrated. Do not build permanent old/new adapters, a shadow-copy phase, a bridge that translates old writes, or per-list authority modes merely for rollout. Before activation:

1. Finish and test the new contribution behavior without enabling it for production users. Back up production data and provide a restore/recovery procedure. Schedule a maintenance window with writes paused or rejected while migration and verification run.
2. Migrate current grocery rows to the new representation once, with a resumable, auditable process. Preserve each row's observed total, unit, shopping state, and existing source data; represent quantity with one editable raw entry per row unless provenance is actually known (no special visible legacy label required). Do not fabricate allocations to recipes or silently consolidate separate rows. Verify counts and totals before reopening writes.
3. Deploy the production schema **and permission changes** that reject unsupported old-client mutations affecting contribution rows or their source lifecycle, including scalar quantity edits, metadata writes carrying stale scalar values, source edits/deletes, reconciliation, move, and offline replay. Identify the exact old writable records and links. New-client write paths must remain authorized. An additive schema, client-side update prompt, app-version claim, heartbeat, or EAS update alone is not a write fence: current startup update checks can fail open, and queued offline writes can return later.
4. Test the fence with an actual pre-feature client build and an updated client against an isolated environment before production cutover. Demonstrate that old writes cannot corrupt migrated data, including a queued offline mutation reconnecting after the permission change; test updated-client create/edit/remove and shared-list flows. If the same-database fence cannot distinguish and reject all dangerous old writes without blocking the new client, stop and reconsider the boundary (including a new InstantDB app) rather than silently accepting corruption.
5. Enable the new client only after migration and fence verification. Provide a clear required-update experience for users of older versions, but treat server-side rejection—not the prompt—as the safety mechanism. Audit a migrated list and a shared list, then reopen writes. Define how to pause new writes, repair from backup, and retry migration if validation fails; rolling back to an old binary that writes incompatible data is not a safe recovery plan.

**GQC-04 evidence update:** The [bounded write-fence investigation](gqc-04-write-fence.md) rejected 22 online legacy mutation cases and 19 pre-fence queued transactions under fully disjoint proof namespaces, while updated shared-member flows remained authorized. A row-only freeze failed to block source/list mutations. This is real SDK/server evidence, **not an actual pre-feature application build or a full application dependency-closure proof**. #44 remains open; neither same-app cutover nor the new-app fallback is approved by this result. Application schema, permissions and existing data were unchanged, and proof configuration/fixtures were restored/removed.

**Separate correctness gate:** Requiring updates only removes the obligation to support _old_ writers. New-client concurrent additions, edits, retries, source synchronization, permission boundaries, and offline/reconnect behavior still need proof against the actual InstantDB SDK. The archived candidate revision-permission protocol failed concurrent projection consistency and whole-operation enforcement; do not reuse it as a verified compare-and-swap. Select a simpler data model/protocol if it avoids a writable aggregate projection, but prove its lifecycle and read completeness before activation. Do not assume a custom backend or server-side transaction isolation exists.

The prior ticket breakdown and execution ledger were set aside and remain recoverable at checkpoint `36752a9` on `implementation/grocery-quantity-contributions`. No replacement tickets or automatic runner are authorized until this PRD is approved.

## Non-goals for first release

- Automatic unit conversion or fuzzy ingredient matching.
- Editing an aggregate and distributing the difference among meals.
- Reconstructing historical recipe allocations from a single scalar quantity.
- Per-entry purchasing/checked state; the shopping row remains the checkable unit.
- Translating old-client offline edits after cutover or supporting old-client writes to migrated data.
- A further visual design exploration; adapt the approved quantity-contributions demo for the confirmed navigation-versus-edit distinction without enabling its mock behavior in production.
