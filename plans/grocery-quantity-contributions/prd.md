# Grocery quantity contributions

Status: planning; no production enablement authorized by this document.

## Goal

Represent a grocery row as a shopping item containing independently editable quantity entries. A row may contain quantities from multiple scheduled meals, direct recipe additions, and manual additions. Keep the grocery list compact while making its quantity explainable in the edit sheet.

## Confirmed product decisions

- A grocery item can contain multiple separately identified quantity entries.
- Entries can originate from scheduled recipe ingredients, standalone planned items, direct recipe additions, or manual additions.
- Adding extra quantity creates a separate manual entry; it does not overwrite a meal's quantity.
- The combined total is calculated and read-only. Users edit individual entries.
- Removing an active scheduled recipe contribution from the grocery sheet deselects that ingredient for that scheduled meal, preventing sync from recreating it.
- Roll out with a one-time production cutover and required client update, not a permanent legacy adapter, shadow mode, or old/new write bridge. Old client versions do not retain editing access after cutover.
- The isolated quantity-contributions demo (#41) is the approved visual target for the Edit Item quantity breakdown, building on the compact duplicate-resolution sheet and existing item-sheet conventions. Production integration and native device QA remain separate work.

## Example

Apples — 5 each

- Apple pie, Friday dinner — 2 each
- Apple butter, added from recipe — 1 each
- Extra apples, added manually — 2 each
- Add quantity

Removing Apple butter leaves 4 apples. Changing the pie entry to 3 leaves 6 apples. Removing the pie entry deselects its meal ingredient without removing the other entries.

## Proposed implementation defaults

These are recommendations, not additional user-confirmed decisions. Review them before implementing new behavior.

- Scheduled contributions follow their specific source instance. Explicit quantity edits write back to that meal's snapshot and establish its existing absolute-quantity override behavior, not a recipe-global edit.
- Direct recipe additions capture an immutable source snapshot; later recipe edits do not change shopping quantities. Each add operation is a distinct instance, including repeated adds of the same recipe.
- Manual entries are independent. Existing quantities whose provenance cannot be reconstructed become a clearly labeled legacy/manual entry, not fabricated recipe contributions.
- The grocery row owns shopping name, category, store, checked/deleted status, and general shopping notes. Entries preserve source identity and source labels/notes. Shopping metadata edits do not fan out to every recipe or source.
- One row has one normalized unit. Combine only matching units initially; no inferred conversions. Cross-store combining remains possible with an explicit resulting row store.
- Different-unit custom combined totals from the demo are deferred pending a separate allocation/conversion design. Do not implement them as an unexplained adjustment that destroys source quantities. This is a deliberate difference from the current demo and needs product acknowledgement before implementation.
- One manual entry uses a familiar quantity control. Multiple entries, or any source-backed entry, show the breakdown. Neither case edits the aggregate directly.
- Checked/deleted items are history and never duplicate targets. Source updates do not silently change purchased quantities or resurrect deleted rows.

## Rollout decision: one-time cutover

The production rollout may require the few existing users to install a new client. A short, announced maintenance window is acceptable. An old client that queued edits while offline may have those edits rejected on reconnection; preserving or replaying those edits is **not** a release requirement. Communicate this limitation and the update requirement before cutover. This approval does not extend to losing edits made by updated clients.

Keep the existing InstantDB app if an enforceable permission boundary can be demonstrated. Do not build permanent old/new adapters, a shadow-copy phase, a bridge that translates old writes, or per-list authority modes merely for rollout. Before activation:

1. Finish and test the new contribution behavior without enabling it for production users. Back up production data and provide a restore/recovery procedure. Schedule a maintenance window with writes paused or rejected while migration and verification run.
2. Migrate current grocery rows to the new representation once, with a resumable, auditable process. Preserve each row's observed total, unit, shopping state, and existing source data; represent quantity with one clearly unattributed entry unless provenance is actually known. Do not fabricate allocations to recipes or silently consolidate separate rows. Verify counts and totals before reopening writes.
3. Deploy the production schema **and permission changes** that reject unsupported old-client mutations affecting contribution rows or their source lifecycle, including scalar quantity edits, metadata writes carrying stale scalar values, source edits/deletes, reconciliation, move, and offline replay. Identify the exact old writable records and links. New-client write paths must remain authorized. An additive schema, client-side update prompt, app-version claim, heartbeat, or EAS update alone is not a write fence: current startup update checks can fail open, and queued offline writes can return later.
4. Test the fence with an actual pre-feature client build and an updated client against an isolated environment before production cutover. Demonstrate that old writes cannot corrupt migrated data, including a queued offline mutation reconnecting after the permission change; test updated-client create/edit/remove and shared-list flows. If the same-database fence cannot distinguish and reject all dangerous old writes without blocking the new client, stop and reconsider the boundary (including a new InstantDB app) rather than silently accepting corruption.
5. Enable the new client only after migration and fence verification. Provide a clear required-update experience for users of older versions, but treat server-side rejection—not the prompt—as the safety mechanism. Audit a migrated list and a shared list, then reopen writes. Define how to pause new writes, repair from backup, and retry migration if validation fails; rolling back to an old binary that writes incompatible data is not a safe recovery plan.

**Separate correctness gate:** Requiring updates only removes the obligation to support _old_ writers. New-client concurrent additions, edits, retries, source synchronization, permission boundaries, and offline/reconnect behavior still need proof against the actual InstantDB SDK. The archived candidate revision-permission protocol failed concurrent projection consistency and whole-operation enforcement; do not reuse it as a verified compare-and-swap. Select a simpler data model/protocol if it avoids a writable aggregate projection, but prove its lifecycle and read completeness before activation. Do not assume a custom backend or server-side transaction isolation exists.

The prior ticket breakdown and execution ledger were set aside and remain recoverable at checkpoint `36752a9` on `implementation/grocery-quantity-contributions`. No replacement tickets or automatic runner are authorized until this PRD is approved.

## Non-goals for first release

- Automatic unit conversion or fuzzy ingredient matching.
- Editing an aggregate and distributing the difference among meals.
- Reconstructing historical recipe allocations from a single scalar quantity.
- Per-entry purchasing/checked state; the shopping row remains the checkable unit.
- Translating old-client offline edits after cutover or supporting old-client writes to migrated data.
- A further visual design exploration; use the approved quantity-contributions demo as the UI target without enabling its mock behavior in production.
