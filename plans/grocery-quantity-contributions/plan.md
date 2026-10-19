# Grocery quantity contributions — staged implementation plan

## How to execute

Each numbered ticket is one bounded agent session and should produce a reviewable commit/PR-sized change. Stages are release boundaries, not single sessions. All tickets start **not started**; track execution and evidence in `progress.md`.

For every session:

1. Read this document, `prd.md`, `progress.md`, and `AGENTS.md`; inspect current code rather than assuming paths are unchanged.
2. Run `pnpx frog list`; log new project friction with `pnpx frog log`.
3. Work only on the ticket and its accepted prerequisites. Do not deploy schema/perms, run production migrations, or enable rollout without explicit authorization.
4. Add focused tests and run `pnpm lint && pnpm tsc` plus `pnpm exec vitest run` for affected suites. Record pre-existing failures separately. UI work must load applicable React Native/UI/typography skills.
5. Record files changed, commands/results, decisions, remaining risks, and the next ticket. Never mark a release gate passed without its required evidence.

No source implementation is included in this planning change. Existing uncommitted demo work must be preserved.

## Codebase anchors

| Area                         | Current entry points                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema, authorization        | `instant.schema.ts`, `instant.perms.ts`                                                                                                                                                                   |
| Database initialization      | `lib/instant/index.ts`                                                                                                                                                                                    |
| Manual add/increment/edit    | `features/grocery-list/instant/add-grocery-list-item.ts`, `increment-grocery-list-item.ts`, `update-grocery-item-only.ts`                                                                                 |
| Item reads/types             | `features/grocery-list/instant/useGroceryListItems.ts`, `features/grocery-list/types.ts`                                                                                                                  |
| Item edit state and diff     | `components/item-sheet/edit-item/edit-item-sheet.tsx`, `components/item-sheet/edit-item/use-live-item-sync.ts`, `components/item-sheet/diff-item-snapshot.ts`, `components/item-sheet/use-item-sheet.tsx` |
| Direct recipe stacking       | `features/recipes/instant/add-recipe-to-list.ts`, `stack-recipe-ingredients.ts`, `stack-recipe-ingredients-plan.ts`                                                                                       |
| Meal creation/sync           | `features/meal-planner/instant/add-recipe-to-meal-plan.ts`, `add-item-to-meal-plan.ts`, `plan-meal-plan-list-sync.ts`, `build-meal-plan-list-sync-transactions.ts`                                        |
| Meal source editing/removal  | `features/meal-planner/instant/meal-plan-ingredient-snapshot-store.ts`, `update-meal-plan-recipe.ts`, `update-meal-plan-item.ts`, `build-meal-plan-entry-removal-transactions.ts`                         |
| Reverse edits/deletion       | `features/meal-planner/instant/plan-list-to-meal-plan-write-back.ts`, `plan-linked-grocery-item-deletion.ts`                                                                                              |
| Reconciliation               | `features/meal-planner/instant/reconcile-meal-plan-list.ts`, `plan-meal-plan-list-reconciliation.ts`                                                                                                      |
| Move/bulk behavior           | `features/grocery-list/bulk-selection/move-orchestrator.ts`, `features/grocery-list/instant/delete-grocery-items.ts`                                                                                      |
| Proposed duplicate UI/domain | `features/meal-planner/components/duplicate-resolution-demo.tsx`, `duplicate-outcome-cards.tsx`, `duplicate-custom-amount-field.tsx`, `features/meal-planner/duplicate-resolution/`                       |
| Migration precedent          | `scripts/backfill-meal-plan-ignored.mjs`, README section on dev Instant migrations                                                                                                                        |

## Architecture and invariants

### Compatibility port

Introduce a quantity domain boundary, provisionally `features/grocery-list/quantity/`:

- Read a normalized item quantity model with `legacy`, `shadow`, or `contributions` provenance and explicit readiness/error state.
- Plan semantic operations: add manual quantity, add recipe instance, upsert scheduled source quantity, edit/remove an entry, resolve a duplicate, and transfer a shopping row.
- Execute via a legacy adapter or a contribution adapter according to persisted **list-level** authority. Callers do not select authority themselves.
- Preserve existing adapters' externally visible behavior while a list is legacy. Do not relabel every old scalar edit as a new contribution.
- Keep source-specific planning outside UI components. The port is not a giant replacement for all item metadata/storage behavior.

The domain model owns the total once activated. `grocery_items.quantity`/`unit` remain compatibility projections. A new client can derive a total from a complete entry set; it must not briefly display zero or declare corruption while relations are still loading.

### Proposed additive data model

Finalize names and exact supported Instant constraints in S0/S1:

- New `grocery_item_quantity_entries` entity linked to exactly one shopping row and its list for access control.
- Entry kind: `manual`, `scheduled-recipe`, `scheduled-item`, `recipe-add`, or `legacy-unattributed`.
- Fields: quantity, canonical unit, source-instance identity, source ingredient identity where applicable, immutable display provenance, timestamps, and source override/lifecycle metadata as necessary.
- Scheduled entries reference their exact meal snapshot or planned item. Recipe-add entries record an add-instance ID, original recipe/ingredient IDs, and display snapshots; provenance survives recipe deletion.
- Stable entry/operation identities make retries idempotent. Two intentional manual adds or recipe adds get different IDs; retrying one gets the same IDs. Concurrent same-source upserts must not create duplicate ownership.
- Optional list authority/version/migration fields are server-controlled or protected using the proven authorization design. Missing fields mean legacy. Never make a new field required on legacy entities during expansion.
- Do not change singular legacy links to `many` in place. Keep old relation shape; use additive relations for new ownership. Do not select an arbitrary meal as the legacy owner of a multi-source row.
- Scheduled provenance links must not cascade-delete a contribution and bypass aggregate maintenance. Row/list cleanup and source removal have deliberate, tested transaction semantics.

### Non-negotiable invariants

1. Every active authoritative entry belongs to exactly one row/list. No cross-list source or entry links are permitted.
2. Total equals the finite sum of active entry quantities in one normalized unit; no NaN, infinity, negative allocations, or inferred unit conversion. Preserve legitimate legacy zero quantities without inventing positive quantity; S0 specifies zero display/removal rules.
3. Removing/editing one source never deletes or rewrites another source's quantity.
4. Scheduled identity is meal-instance + source ingredient/snapshot, not recipe ID or item name. Reconciliation is idempotent.
5. Manual additions and separate direct recipe adds remain distinct entries even if names match.
6. Buying/deleting history is not recomputed from later recipe/servings changes. Removing a source preserves purchased history without preserving live ownership that can recreate it.
7. Aggregate projection and contribution changes have a verified concurrency strategy. A client read-modify-write in one `db.transact` is not by itself protection against another client.
8. An old client cannot overwrite authoritative source ownership unnoticed. No authority switch until the old-writer gate passes.
9. No partial semantic operation: source deselection, entry changes, row totals, attribution, and operation acknowledgement commit consistently, or recover idempotently under the proven execution protocol.
10. Rollback does not flatten multi-source data into a scalar and pretend source ownership still works.

## Rollout states

| State                   | Authority and behavior                                                | Compatibility                                                              |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| L0 legacy               | Existing scalar/links, unchanged behavior                             | Old clients fully supported                                                |
| L1 compatible client    | New code uses port, delegates to legacy adapter                       | Can ship independently of new schema                                       |
| L2 shadow               | Scalar remains authority; optional entries are diagnostic copies only | Old writes remain valid; shadow may lag and cannot drive shopping behavior |
| L3 contributions        | Verified cutover; entries authoritative, scalar projection maintained | Only under S0-approved and S4-proven old-writer policy                     |
| L4 retired legacy paths | Remove old adapters after verified retirement window                  | Scalar/schema removal is a separate future migration                       |

Authority is per list, not per user: collaborators must see the same model. Release flags control availability, not database integrity. A bridge, if adopted, must have a durable checkpoint/replay protocol; two clients racing to repair drift is not a bridge.

**Compatibility gate:** This repository currently contains direct-client Instant writes and admin migration scripts, not a demonstrated server-authoritative quantity service. Do not assume triggers, serializable transactions, compare-and-swap, secure client-version claims, or durable change streams. S0 must prove actual platform capabilities in a disposable app. If they are insufficient, design and deploy the missing trusted service or get explicit approval for a narrower upgrade boundary. Keep lists L0–L2 meanwhile.

## S0 — Architecture contracts and compatibility proof

### QTY-01: Inventory all readers/writers and lock behavior contracts

Dependencies: none.

Deliverables: `architecture.md` with a read/write inventory and operation-by-operation legacy/new matrix. Include manual add/increment, direct recipe adds, all meal/snapshot setters, recipe propagation/deletion, live edit flush/debounce, saved-item side effects, unlink recipe, check/uncheck, clear, delete, leave/list deletion, move/merge, reconciliation, frequent-item add events, and offline retries.

Acceptance:

- Confirm PRD defaults with product owner, especially direct-recipe snapshots, shopping-metadata ownership, same-unit-only totals, and deferral of demo custom totals.
- Specify empty/zero entry behavior, last-entry removal, and standalone scheduled-item removal (ignore planned item). Removing a scheduled recipe entry must deselect that source even when it was the last selected ingredient; the meal may also become ignored. Existing whole-row deletion preserves the final selection when ignoring a meal, so do not reuse that exception for entry removal.
- Define checked/soft-deleted freeze/detach semantics, checked→unchecked behavior, and source re-selection as explicit state transitions.
- Define source rename/unit changes: if one source becomes incompatible with a shared row, split that entry into a compatible row rather than rewriting everyone else's unit/name or auto-merging elsewhere.
- Define moves: preserve source provenance as history, detach live source ownership/deselect at origin to avoid recreation; destination row owns shopping state. Cross-mode moves retain one legacy aggregate unless source detail can be represented safely; flag any destructive provenance downgrade for approval.
- Identify all pre-bridge releases that can still write to the database, including EAS updates and queued offline transactions.

Verification: inventory mapped to actual call sites/tests; reviewed behavior matrix. No schema or behavior change.

### QTY-02: Prove old-writer, concurrency, and authorization strategy

Dependencies: QTY-01.

Deliverables: `compatibility-proof.md` and a repeatable disposable-Instant-app harness. Select and document exactly one activation policy:

A. Verified trusted translation/serialization path for all supported old/new mutations, including source edits/deletes, not just scalar quantity updates; or
B. Explicitly approved list upgrade boundary that prevents unsupported old writes at the data layer and provides a compatible-client upgrade experience. This is a requirement change if old clients must retain editing access; do not choose it silently.

Acceptance:

- Run an actual pre-feature build alongside a bridge/new build, not two instances of current code with a local flag.
- Reproduce old scalar edit, metadata-only edit carrying a stale full quantity snapshot, source edit, hard/soft delete, link replacement, old reconciler, two simultaneous adds, retry, offline replay after cutover, and concurrent activation.
- Demonstrate how stale aggregate projections are prevented/repaired without overwriting entry intent, and how an old destructive write is handled before losing information. A post-delete poll alone is insufficient.
- Verify available permissions semantics for before/after link changes, source/list membership, authority fields, and any new trusted command path. Show no client can self-enable authority or spoof a supported version.
- Specify operation ordering/idempotency, service outage behavior, command rejection visibility, durable replay, and offline capability. Verify installed SDK behavior: a resolved mutation may mean locally enqueued, not server-acknowledged, and comments about offline `queryOnce` support are not guarantees. EAS startup updates fail open and cannot retire offline writers. If safe offline contribution writes cannot be proved, explicitly require online acknowledgement for those operations while keeping offline reads; obtain approval.
- Provide an operational/deployment owner for any trusted service. No server infrastructure work may be hidden inside a UI ticket.
- Gate outcome is PASS with evidence or BLOCKED with a concrete prerequisite ticket. Stages S1–S3 may proceed without activation, but S4 onward cannot pass this gate on assumptions.

Verification: saved test logs and supported-client matrix. This task is a bounded proof, not an instruction to build an unscoped backend in one session.

## S1 — Domain and compatibility port, no behavior change

### QTY-03: Pure quantity-entry domain and planners

Dependencies: QTY-01; use provisional storage-independent types until QTY-02 selects execution semantics.

Deliverables: pure types, validation, summation, identity rules, and planners in the quantity domain; fixtures for mixed manual/scheduled/direct-recipe rows.

Acceptance: deterministic operation IDs; exact-source identity; separate repeated recipe instances; same-unit validation; overflow handling; zero/last-entry rules; source removal and incompatible-source split plans; immutable inputs. Pure tests demonstrate 2 + 1 + 2 = 5, edit one entry, remove one entry, and idempotent retry.

### QTY-04: Port and legacy adapter

Dependencies: QTY-03.

Deliverables: typed port contracts and a legacy adapter wrapping current operations; no contribution writes or new UI.

Acceptance: missing persisted capability always routes legacy; unreadable capability never falls forward; legacy add/stack/move/write-back behavior stays the same; operation errors are typed; no mock server guarantee leaks into the interface. Contract tests cover both planned adapters.

### QTY-05: Route existing quantity writers through the port

Dependencies: QTY-04.

Deliverables: replace quantity writes at existing manual, recipe, meal, removal, reconcile, and bulk entry points with port/adapter calls, splitting mechanical wiring into follow-up sessions if inventory is larger than one reviewable change.

Acceptance: inventory is updated with every call site; raw quantity writes remain only in named adapters/projection builders and test fixtures; metadata-only paths preserve saved-item and recipe-sync semantics in legacy mode; old UI and public hook behavior unchanged. A static audit/test catches new bypasses. Run legacy regression suites.

Release gate S1: compatible release can run against the current database without additive schema; no user-visible behavior change.

## S2 — Additive persistence and safe diagnostic migration

### QTY-06: Add schema, relations, permissions, and query contracts

Dependencies: QTY-02 (authorization design), QTY-03.

Deliverables: additive entity/relations/optional capability fields, item entry queries/types, and authorization tests against a disposable app.

Acceptance: old query relation shapes and required fields unchanged; source display survives recipe deletion; source and destination list permissions cannot be bypassed by relinking an entry; users cannot attach someone else's private recipe/source or alter authority; new recipe/store provenance visibility is authorized without broadening private data access. Explicitly test revoked membership and row moves.

Deployment: schema before new readers; permissions coordinated with service/adapter availability; old app smoke test after each deployment. No production push in this coding ticket.

### QTY-07: Diagnostic backfill, audit, and repair tooling

Dependencies: QTY-06.

Deliverables: resumable list-scoped admin script with dry-run, checkpoints, stable IDs, audit-only mode, and no secret output.

Acceptance:

- No row quantity, check state, or legacy ownership changes during shadow backfill; no automatic consolidation of existing rows.
- Verified single-source legacy links seed that source with the current observed quantity. Do not rescale the source and change the shopping list during migration.
- Unlinked/ambiguous/previously-stacked rows preserve exactly the current total as one unattributed entry. A singular recipe tag is not evidence for allocating the entire total to that recipe.
- Detect dual legacy source links, missing sources, source-vs-row mismatch, invalid quantities, and unsupported units; quarantine/report instead of guessing.
- Page/batch safely, handle interruption/retry and concurrent legacy writes, and label the shadow snapshot non-authoritative. Two backfills cannot create duplicate entries.
- Cutover will revalidate under a writer barrier; a completed shadow backfill is not proof it remains current.

Verification: throwaway-app fixtures including checked/deleted items, zero quantities, orphan links, interruption and rerun; totals before/after unchanged.

### QTY-08: Shadow adapter and drift diagnostics

Dependencies: QTY-05, QTY-07.

Deliverables: optional shadow write planning/audits for compatible clients, list-scoped mismatch reporting, and a read adapter that always uses legacy authority in L2.

Acceptance: diagnostic failures cannot prevent legacy shopping writes; gaps caused by old clients are reported as expected shadow staleness, not automatically fixed from stale entries; no client repair loops; logs avoid item names/recipe notes unless explicitly permitted. Disable shadowing with no data loss.

Release gate S2: additive deploy and compatibility release coexist with real old clients; diagnostic backfill is repeatable; legacy remains authority.

## S3 — Authoritative contribution adapters and lifecycle (disabled)

### QTY-09: Commit protocol, projection maintenance, and command adapter

Dependencies: QTY-02 PASS, QTY-06, QTY-08. If QTY-02 requires new service infrastructure, first split its design into bounded implementation/deploy tickets in `progress.md`; do not treat that prerequisite as already done.

Deliverables: contribution adapter implementing the proven execution protocol; operation receipts/idempotency, complete-entry read states, scalar projection maintenance, deterministic error/retry handling.

Acceptance: duplicate retries do not double-add; concurrent independent entry additions survive even when both clients started from the same total; same-source races produce one authoritative entry; aggregate converges without lost allocations; projection/command restart tests pass; unauthorized/stale operations are rejected visibly. Source mutations participate in the same protocol, not a parallel unsafe client transaction.

### QTY-10: Manual and direct-recipe contribution operations

Dependencies: QTY-09.

Deliverables: manual create/add/edit/remove and direct-recipe instance creation; preserve per-ingredient identity before any stacking aggregation loses it.

Acceptance: repeated recipe adds have distinct operation instances; ingredient selections/default store rules preserved; source deletion retains snapshot labels; recipe global edits do not mutate snapshot quantities; add events count user additions once, not every projection/repair; recipe `lastAddedToListAt` behavior preserved. Legacy adapter still behaves as before.

### QTY-11: Scheduled source sync and overrides

Dependencies: QTY-09.

Deliverables: scheduled recipe and standalone item entry lifecycle integrated with source setters, servings/selection changes, source edits/propagation, recipe deletion, meal ignore/restore, and clear/remove flows.

Acceptance: editing one meal changes only its entry; explicit quantity edit marks that meal snapshot overridden; removing an active recipe entry deselects it in the same semantic operation; removing standalone scheduled quantity ignores that planned item; removing the last selected contribution still deselects that ingredient and may additionally ignore the meal (unlike the legacy deletion exception); repeated reconciliation never recreates an intentionally removed entry; incompatible source changes split only that source; purchased history is frozen/detached as specified in QTY-01.

### QTY-12: Shared-row delete, move, metadata, attribution, and reconciliation

Dependencies: QTY-10, QTY-11.

Deliverables: contribution-aware check/uncheck, delete/clear, bulk move/merge, list leave/delete cleanup, metadata editing, recipe unlink/attribution UI data, and drift reconciliation.

Acceptance:

- Delete a row handles all active scheduled sources without deleting unrelated sources/rows; checked history rules remain intact.
- Move is a true transfer, retry-safe, never duplicates quantities after partial failure, and never leaks provenance from inaccessible lists. Cross-authority-mode moves follow QTY-01's explicit policy; do not silently flatten multi-source data.
- Row metadata edits do not copy aggregate quantity or store into every recipe. A singular legacy recipe tag is not authoritative attribution.
- Existing saved-item behavior is preserved where still meaningful; propagation to recipe ingredients requires an unambiguous source, never name-only fanout from a merged row.
- Reconciliation audits entries and projections; it does not call the old one-row-per-source reconciler for L3 lists. Repair missing caches without discarding manual entries.

Release gate S3: full lifecycle is correct in a disposable contribution-enabled list with UI still unavailable to production users. No partial activation that enables add but leaves old remove/reconcile paths running.

## S4 — Compatibility enforcement and list activation

### QTY-13: Implement verified writer bridge or approved upgrade fence

Dependencies: QTY-02 PASS, QTY-09–QTY-12.

Deliverables: enforcement/translation selected by QTY-02, deployment runbook, supported-client matrix, and real-old-build integration tests.

Acceptance: all hazardous legacy writers from inventory are covered, including source changes, hard deletes, offline replay, old reconcile and move. Bridge processes are durable and idempotent. A client-only UI check or heartbeat is not accepted as a fence. If an upgrade fence was approved, both its authorization enforcement and the limitations of unmodified old-client UX are documented and tested; never call blocked edits seamless compatibility.

### QTY-14: Resumable list cutover and kill switches

Dependencies: QTY-07, QTY-12, QTY-13.

Deliverables: explicit activation state machine and admin tools, audits, recovery, per-list feature enablement, and emergency disable controls.

Acceptance:

- Acquire the proven writer barrier/serialization boundary; re-read current legacy rows and source graph, refresh shadow entries, validate totals/provenance, then publish authority. Prevent stale old queued writes afterward according to QTY-13.
- Activation concurrent with another activation, member join/leave, write, move, crash, or timeout is safe and resumable; no partially authoritative list visible to clients.
- Failed or ineligible lists stay legacy; no bulk activation by app launch. Define ownership of activation and list eligibility; no app-controlled self-upgrade.
- Existing rows remain separate at cutover. Merging is an explicit later add decision.
- New contributions UI off does not restore legacy writers on an L3 list. Emergency rollback disables mutations or uses the validated contribution adapter until repaired; old binary rollback to an unsafe reconciler is forbidden.

Release gate S4: compatibility proof passes against deployed enforcement; named operational owner approves canary activation. If seamless old editing remains unproved, stop here and keep L0–L2.

## S5 — Contribution-aware item edit sheet

### QTY-15: Read model and quantity-section components

Dependencies: QTY-03, QTY-06; can build against fixtures in parallel with S3.

Deliverables: reusable quantity section driven by a discriminated legacy/contribution read model; source labels/date context, per-entry controls, read-only total, and add-quantity action.

Acceptance: one manual entry stays simple; source-backed/multiple entries show breakdown; loading/incomplete/failed queries never look like an empty row; deleted/private recipes use safe snapshot labels; long names, decimals, zero legacy values, many entries, screen readers, keyboard, and large text are covered. No fixture imports in production components.

### QTY-16: Wire entry editing and removal into the live sheet

Dependencies: QTY-10–QTY-12, QTY-15; production enablement additionally requires S4 gate.

Deliverables: sheet entry state/diffs, per-entry commit/debounce/flush lifecycle, add/remove UX, mutation feedback, and capability-based rendering.

Acceptance: aggregate never emits a scalar edit on a contribution list; switching items/closing flushes the correct entry IDs once; remote deletion/edit invalidates stale controls safely; remove a scheduled entry deselects the source; failed operations preserve recoverable input; double taps/retries are idempotent; legacy sheets remain unchanged. Existing unit sheet's whole-number input limitation must not constrain decimal entries; use shared validated quantity input or address the logged limitation deliberately.

Release gate S5: native iOS/Android edit lifecycle and accessibility testing; contribution UI appears only on fully activated lists and compatible clients.

## S6 — Production duplicate resolution and direct recipe integration

### QTY-17: Executable batch duplicate-resolution planner

Dependencies: QTY-03, QTY-10, QTY-11, QTY-12.

Deliverables: production decision types/planner for keep separate, same-unit combine, and explicit existing/incoming-store result. Reuse detection/projection where compatible; do not import demo-only choices as executable persistence instructions.

Acceptance: stable source IDs; matching excludes checked/deleted rows; repeated incoming sources retain identity; every source becomes one entry; multiple sources targeting one row have one consistent final store and aggregate; conflicting store choices require re-review or a single explicit row-level decision, not last-write-wins. Revalidate current target/source state before commit with the proven concurrency protocol. Preserve defaults: combine compatible entries, otherwise separate. Unit mismatch offers separate only until custom allocation design is approved.

### QTY-18: Extract compact sheet and integrate Add to Meal Plan

Dependencies: QTY-16, QTY-17; production enablement requires S4 gate.

Deliverables: real compact sheet accepting domain inputs, real store labels, confirm/cancel/pending/error callbacks; hook into recipe and standalone Add to Meal Plan without fixture dependencies. Keep dev demo as a consumer/fixture harness if useful.

Acceptance: no conflicts commits directly; one conflict opens detail; many conflicts show defaults overview; no writes before confirmation; cancel preserves original form; stale targets refresh with clear explanation and preserve only still-valid choices; scheduled entry/snapshots/quantity changes commit consistently. Preserve recipe-close and continuous-item-entry behaviors. Test sheet stacking, keyboard dismissal, double submit, swipe-dismiss while pending, and failed commit.

### QTY-19: Direct recipe Add to List integration

Dependencies: QTY-18.

Deliverables: reuse compact resolution/session flow from existing direct-recipe add surfaces via the quantity port, rather than a second contribution model.

Acceptance: ingredient selections and serving scaling preserved; each intentional recipe add creates a distinct add instance; offline/pending semantics match QTY-02; cancel commits nothing; recipe timestamp and frequent-item events occur only once on successful add. Legacy lists continue existing stacking/prompt behavior until separately opted into new UI.

Release gate S6: all requested origins are available; unit-mismatch scope difference from demo is acknowledged in release notes/product sign-off.

## S7 — Canary, expansion, and legacy retirement

### QTY-20: Cross-client regression harness and canary runbook

Dependencies: QTY-14, QTY-16, QTY-19.

Deliverables: reproducible real-client matrix, semantic-operation regression tests, list-level audit dashboards/reports, and staged enablement checklist.

Required scenarios:

- Old+old on legacy list; new+old on legacy/shadow list; new+new on activated list; old client observing/writing activated list under the exact selected policy.
- Online/offline/reconnect, killed app, duplicate commands, worker restart, revoked permissions, stale sheet, two adds to one row, same-source concurrent changes, migration during a write.
- 2 + 1 + 2 example, repeated same recipe, overrides then servings change, source removal, source unit split, manual extra preserved, checked/deleted history, clear, move/merge, recipe/source deletion, list leave/delete.
- Totals and visible row count before/after migration unchanged; no unauthorized provenance access; no orphan/duplicate authoritative entries; contribution sum equals projection after settled acknowledgement.

Canary progression: disposable app → internal lists → small explicit production cohort → staged eligible lists. Each step needs a named owner, observation window, zero unexplained allocation loss/duplicate-source errors, bounded projection drift recovery, and documented stop/rollback criteria. Do not auto-enable all lists from client rollout percentage.

### QTY-21: Retire legacy writers progressively

Dependencies: QTY-20 and operational evidence that targeted lists/clients are eligible; this is a later release, not immediate cleanup.

Deliverables: remove unused scalar editing UI paths and adapters only after legacy-list migration/retirement is verified; preserve projection fields and compatibility links as long as required by supported clients.

Acceptance: audit shows no supported writer bypasses the port, no pending legacy migration cohort, and no recoverable old queue can bypass enforcement; archive migration/proof tooling and rollback playbook. Deleting scalar attributes or changing old relation cardinality requires a separate future expand/contract plan and explicit approval. A feature-flag flip alone is not retirement evidence.

## Dependency/parallelization guide

```text
QTY-01 → QTY-02
QTY-01 → QTY-03 → QTY-04 → QTY-05
QTY-02 + QTY-03 → QTY-06 → QTY-07
QTY-05 + QTY-07 → QTY-08
QTY-02 PASS + QTY-06 + QTY-08 → QTY-09
QTY-09 → QTY-10 and QTY-11 (parallel with shared-contract coordination)
QTY-10 + QTY-11 → QTY-12 → QTY-13 → QTY-14
QTY-03 + QTY-06 → QTY-15 (fixtures; parallel with persistence work)
QTY-10–12 + QTY-15 → QTY-16
QTY-10–12 → QTY-17 (parallel with QTY-15/16)
QTY-16 + QTY-17 → QTY-18 → QTY-19
QTY-14 + QTY-16 + QTY-19 → QTY-20 → QTY-21
```

Schema/permissions and shared port contracts have one owner at a time. Do not parallelize two sessions editing the same migration/authority boundary without an agreed contract. UI may be developed behind fixtures before activation; it must not enable incomplete lifecycle behavior.

## Outstanding decisions and hard blockers

- **Compatibility:** seamless editing by pre-feature clients versus an explicitly approved upgrade boundary. Until QTY-02 proves one, production activation is blocked; retaining a scalar cache does not solve this.
- **Execution infrastructure:** prove supported Instant concurrency/permissions primitives or scope trusted service work explicitly. No reliance on undocumented triggers or transaction isolation.
- **Offline contribution writes:** preserve safe offline behavior if proved; otherwise explicit product acceptance of online-only contribution mutations is required before activation.
- **Units/custom totals:** approve same-unit-only first release or commission a separate per-source allocation design. Do not quietly ship all demo choices as if supported.
- **UI/metadata defaults:** QTY-01 records product approval of proposed source snapshot, shopping metadata, zero/history, and cross-mode move rules.

Next session: **QTY-01**, not schema deployment or wiring the demo Confirm button.
