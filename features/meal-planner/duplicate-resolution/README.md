# Meal-plan duplicate resolution proposals

This module is pure and disconnected from live meal-plan mutations. It is used by
the development UI demos and tests, and does not query the database, transact,
change the schema, or change the existing direct-to-list stacker.

## Public API

- `detectDuplicates({ listId, incoming, existingItems })` snapshots a batch for
  review. Invalid inputs throw: source/item IDs must be unique, names nonempty,
  incoming quantities finite and positive, existing quantities finite and
  nonnegative. Empty units are allowed and only match other empty units.
- `planDuplicateResolution({ detection, decisions, existingItems })` returns an
  `ok` proposal or typed errors, never a partial executable plan. Supply fresh
  existing items when confirming. Changed candidates, target quantities/metadata,
  disappeared targets, or new duplicates require re-review. Invalid inputs are
  returned as `invalid-input`; missing/invalid choices have distinct error codes.
- `recordDecision`, `applyChoiceToRemaining`, and `getDuplicateProgress` operate
  on immutable decision maps. Back/review navigation is owned by presentation;
  revising a choice replaces that entry and Reset/Cancel uses a new empty map.
- `projectRecipeDuplicateInputs` uses existing meal projection/default-store
  rules while preserving ingredient identity, selections, servings, and quantity
  overrides. `projectStandaloneDuplicateInput` handles standalone plan items.

## Matching and session defaults

Every same-name existing unchecked, non-deleted destination-list item prompts,
including exact matches. Names and units trim, lowercase, and collapse whitespace;
there is no fuzzy matching, aliasing, or unit conversion. Store IDs compare exactly
(absent IDs match). Category and note differences do not prevent incrementing.
The newest compatible existing target is selected, with ascending ID tie-break;
missing/invalid update timestamps rank at zero. All same-name candidates are
available for display, even when none may be incremented.

Conflict IDs are incoming `sourceId`s. Each incoming item is reviewed independently
against the original existing-list snapshot, not against other incoming items.
Use batch-unique source IDs when reviewing multiple instances of the same recipe.

Bulk choices affect the current conflict plus remaining unresolved conflicts,
preserving earlier answers on other items. Bulk increment leaves incompatible
items unresolved; it never silently chooses separate for them. The current item
can be revised during Back/review. Progress counts valid known decisions only.

Creates retain incoming metadata; increments contain only a target ID, quantity
delta, and every contributing incoming source. Existing target metadata is not
overwritten. Several sources can contribute to the same proposed increment.

## Persistence boundary — do not skip

The current schema links each grocery item one-to-one with a meal-plan ingredient
snapshot or standalone item. Reconciliation and bidirectional edit/write-back
assume a single owner. Persisting these increments with today's transaction
builders would either steal a link or make subsequent meal edits/removal overwrite
or delete another meal's quantity.

**These outputs are proposals, not transaction chunks.** A later production phase
must design independent contribution tracking (including manually added baseline
quantities), shared ownership, aggregate edits/write-back, source removal,
checked/deleted history, and migration/permissions before connecting to live
Add to Plan. Rechecking fresh inputs here does not provide database transaction
isolation; production integration must also resolve concurrent writes.

## Verification

`pnpm vitest run features/meal-planner/duplicate-resolution/__tests__/duplicate-resolution.test.ts`

Coverage includes matching, deterministic targets, checked/deleted/list filtering,
source identity, incompatible bulk actions, revised choices, incomplete/invalid
batches, stale quantities/targets, arithmetic overflow, projection rules, and input
immutability. Demo rendering and native sheet behavior require separate manual
verification.
