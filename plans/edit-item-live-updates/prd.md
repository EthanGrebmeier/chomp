# Edit Item Sheet — Live Updates

## Problem Statement

When I open a grocery list item to edit it, I have to change fields and then tap an "Update Item" button at the bottom of the sheet to persist my changes. This extra confirmation step is unnecessary friction for what is almost always an immediate-intent change (I know I want the quantity to be 3, not 2). It also makes the sheet feel heavier than the rest of the app — adjusting a pill or a quantity should feel like it "just happened."

Worse, because the button is the only commit path, if I tap outside the sheet to dismiss it, my edits are silently lost, which I don't notice until later.

## Solution

The edit item sheet persists changes as I make them. There is no "Update Item" button. I close the sheet by swiping it down or tapping outside it, and everything I changed is already saved.

Changes to structured fields (category, quantity, unit, store) feel instantaneous. Changes to free-text fields (name, notes) are debounced briefly so we're not writing on every keystroke, but they're committed before the sheet closes no matter when I dismiss.

Writes to the linked `saved_item` (which is shared across lists and devices) are batched and only happen when the sheet closes, so quickly changing the name of a one-off grocery item doesn't repeatedly rewrite the shared saved item's name for every keystroke.

## User Stories

1. As a grocery list user, I want the edit sheet to save changes as I make them, so that I never have to think about whether I confirmed my edits.
2. As a grocery list user, I want to dismiss the edit sheet by swiping it down and have my changes persist, so that closing and confirming are the same action.
3. As a grocery list user, I want changes to the quantity pill to apply the moment I confirm them in the quantity sub-sheet, so that I see the new quantity reflected in the list immediately.
4. As a grocery list user, I want changes to the category and store pills to apply immediately on confirm or clear, so that the edit sheet behaves consistently across pill controls.
5. As a grocery list user typing a new item name, I want my edits to be committed after I stop typing briefly, so that saved writes don't thrash on every keystroke.
6. As a grocery list user, I want my pending typed edits to still be saved if I dismiss the sheet while the debounce timer is running, so that I don't lose the last few keystrokes by closing too quickly.
7. As a grocery list user, I want the sheet to skip writing when I've temporarily cleared the name field, so that an intermediate empty state doesn't corrupt the item.
8. As a grocery list user editing notes on an item, I want the notes to save automatically as I type, so that I don't need to hit a button to commit them.
9. As a grocery list user, I want the "Update Item" button removed from the sheet, so that I'm not confused about whether I need to tap it.
10. As a grocery list user, I want the success toast removed, so that silent, instant edits don't get announced on every tweak.
11. As a grocery list user picking an item from the autocomplete suggestions, I want the pick to be committed immediately, so that my subsequent edits are diffed against the new chosen item.
12. As a grocery list user picking an item from autocomplete while the debounce timer is counting, I want the autocomplete pick to take precedence and cancel the pending keystroke write, so that I don't get a stale name saved right after I pick a match.
13. As a grocery list user, I want clearing the recipe tag on an item to unlink the recipe immediately, so that my list is reconciled without me having to confirm anything.
14. As a grocery list user who owns a linked saved item, I want my edits to the grocery item's name, category, notes, and store to sync to the shared saved item when I close the sheet, so that my personal saved-items library stays up to date.
15. As a grocery list user who does not own the linked saved item, I want my edits to stay local to this grocery item and not overwrite the shared saved item, so that I can personalize an entry without stepping on another user's data.
16. As a grocery list user working offline, I want my live edits to be queued by Instant's optimistic pipeline like every other write, so that I don't need new error handling to worry about.
17. As a grocery list user hitting the return key in the name input, I want the keyboard to dismiss (not the sheet), so that I can keep adjusting pills without closing the sheet.
18. As a grocery list user confirming the quantity sub-sheet with an invalid quantity, I want both quantity and unit to be gated by the confirm button, so that I can't accidentally save a partial change.
19. As an Add Item flow user, I want the existing Add Item sheet behavior to remain unchanged, so that this change is scoped to the Edit flow.
20. As a developer extending the item sheet, I want the live-update logic encapsulated in a dedicated hook, so that I can reason about it independently from the shared `useItemSheet` state.
21. As a developer maintaining the Instant writes, I want the write path split into "grocery item only" and "saved item sync" functions, so that each write's responsibility is legible from its name and callable independently.
22. As a developer, I want a pure `diffItemSnapshot` helper with trim-normalized string comparison, so that I can test "what should we write?" without any React or Instant machinery.

## Implementation Decisions

### Behavior — timing model

- The edit sheet owns two persistence pathways:
  - **Live writes**, fired as the user edits. These touch the grocery item and its links to `stores`/`saved_items`.
  - **Close-time writes**, fired when the sheet begins dismissing. These touch the linked `saved_item` (name, category, notes) and the `saved_items↔stores` link, plus a local-saved-item upsert when there is no cloud saved item linked.
- Text fields (`name`, `notes`) go through a 300ms trailing debounce.
- Non-text fields (`category`, `quantity`, `unit`, `storeId`) fire an immediate live write on change. Sub-sheet confirm buttons gate validity for quantity/unit/category/store, so the top-level state only ever transitions between valid values.
- Pill "clear" affordances (category and store) fire immediate live writes because they bypass the confirm sub-sheet.
- If the sheet begins closing while a debounce timer is pending, the pending write is flushed synchronously before the close-time sync runs.
- If the user clears the name field to empty, the live write path is skipped until the name is non-empty again. The close-time path does not flush if the final name is empty.
- No success toast is shown.

### Behavior — autocomplete pick

- Picking a match from the autocomplete dropdown cancels any pending text-field debounce.
- A pick immediately triggers a single live write that updates the grocery item's `name`/`category`/`notes`/`storeId` and relinks `grocery_items↔saved_items` as needed.
- After a pick, the diff snapshot is **rebased** to the picked `saved_item`'s values (name/category/notes/storeId and the new `savedItemId`/`ownerId`/`storeId`). Subsequent edits diff against the new target. Picking alone does not cause a close-time saved-item write.

### Behavior — saved item sync on close

- The close-time sync only writes fields whose current values differ from the snapshot (or rebased snapshot) after trimming.
- For cloud saved items, the sync only writes to `saved_items` when the current user is the owner of the linked saved item. Ownership is carried alongside the pick in the autocomplete flow (see "Data — MatchingItem" below), and taken from the incoming item on initial present.
- For grocery items with no cloud saved item linked (or where the user picked a local-only match), the close-time path upserts a local saved item when there are relevant diffs.
- The `saved_items↔stores` link is reconciled (linked/unlinked) on close when the store diff is non-empty.

### Behavior — dismiss semantics

- There is no "Update Item" button. Users dismiss the sheet by swipe or tap-outside.
- `onStartClose` is the hook point for flush + close-time sync.
- `onDismiss` (after the sheet is fully closed) is the hook point for state reset and clearing the snapshot ref.
- Hitting return in the name input blurs the input (dismisses the keyboard) and does not dismiss the sheet or fire any special flush; the debounce effect already handles the pending write.

### Behavior — race handling

- Sheet state is initialized once from the item at `present()` time. Subsequent Instant query updates are not re-applied to the edit form, so the user's in-progress edits cannot be clobbered by incoming live data.

### Modules — new

- A pure diff helper that takes a snapshot and current field state and returns only the fields that differ, using trim-normalized comparison for string fields.
- A thin Instant writer that updates the grocery item row, reconciles the grocery-item-to-store link, and performs grocery-item-to-saved-item relink when the autocomplete pick requires it.
- A thin Instant writer that syncs saved item fields, reconciles the saved-item-to-store link, and upserts a local saved item when no cloud saved item is linked. It contains the owner gate so callers don't have to.
- A hook composed into the edit sheet provider that owns the snapshot lifecycle (capture on present, rebase on pick, clear on dismiss), drives live writes from the shared item-sheet state, and exposes a `flushAndSyncOnClose` method the sheet calls from `onStartClose`.

### Modules — modified

- The existing `updateGroceryListItem` becomes a thin wrapper that composes the two new writers, so the Add Item flow keeps its current one-call behavior untouched.
- The shared item-sheet hook exposes a dedicated autocomplete-pick handler that accepts the picked match and its owner id, so the edit sheet can relink and rebase snapshot in one event.
- The matching-items source is extended so every autocomplete match carries the owner id of its underlying saved item, enabling ownership decisions at pick time without a follow-up query.
- The edit item sheet component drops the footer button, wires `onStartClose` to `flushAndSyncOnClose`, moves `reset` to `onDismiss`, and passes the live autocomplete-pick handler down to the item form.
- The item input component's return-key handler is changed from "submit" to "blur the name field."
- The quantity/unit sub-sheet confirm is tightened so unit does not commit in isolation when quantity is invalid.

### Data — MatchingItem

- `MatchingItem` gains an optional `ownerId`. `useUnifiedSavedItems` is responsible for surfacing the underlying saved item's user id to the matching-items layer. Local-only matches do not need an `ownerId`.

### Error handling

- Live writes do not introduce new error handling. They rely on Instant's optimistic UI and offline queue, consistent with the rest of the app's write path.

### Debounce

- The hook uses `useDebounceCallback` from `usehooks-ts` (already a dependency) with a 300ms delay and trailing edge, exposing its `flush`, `cancel`, and `isPending` controls for the close-time flush, autocomplete cancel, and internal bookkeeping respectively.

### Scope of change

- This PRD covers the Edit Item Sheet only. The Add Item Sheet's submit-on-button flow is intentionally unchanged.

## Testing Decisions

A good test for this feature exercises external, observable behavior: given a snapshot and a set of current field values, the right diff comes out; given a set of inputs, the writer fires the right Instant transactions in the right order with the right payloads. Tests should not assert on internal refs, effect scheduling, or the debounce timer's shape.

Modules to be tested:

- **`diffItemSnapshot`** (pure). Covered cases: no diff when snapshot matches current; individual field diffs for name/category/notes/quantity/unit/storeId; trim-normalized string comparison (`"foo "` vs `"foo"` is not a diff); empty-string vs undefined for optional fields; partial-object shape of the output.
- **`updateGroceryItemOnly`** (Instant writer). Covered cases: simple field update; store link/unlink/relink via the existing `linkStoreToItem` helper; relink to a newly picked cloud saved item; unlink cloud saved item when a local match is selected. `db.transact` is stubbed; the test asserts on the calls made.
- **`syncSavedItemFromGroceryItem`** (Instant writer). Covered cases: no-op when diff is empty; saved-item field update path when owner; skip when not owner; saved-item store link/unlink reconcile; upsert-local-saved-item path when no cloud saved item is linked. `db.transact` and `upsertLocalSavedItem` are stubbed.

The `useLiveItemSync` hook itself is not unit-tested in this PRD; its behavior is exercised via the three deeper modules and validated manually through the edit flow. If a later ticket wants integration-level confidence over the full debounce/flush interaction, it can be added without redoing the above tests.

Prior art:

- `components/item-sheet/__tests__/unit-utils.test.ts` and `lib/utils/__tests__/trim-string-fields.test.ts` are good models for the pure `diffItemSnapshot` tests.
- `features/recipes/utils/__tests__/*` and `features/recipes/instant/__tests__/stack-recipe-ingredients.test.ts` provide structural prior art for utility/transform tests.
- There is no existing prior art in this repo for mocking `db.transact` directly; the writer tests introduce this pattern and should keep it minimal (stub the `db` module) so later Instant-writer tests can follow suit.

## Out of Scope

- The Add Item Sheet's submit pattern.
- Any schema or permission changes in Instant.
- Changing the autocomplete's matching or sort logic.
- Introducing undo/redo for edits.
- Surfacing new user-facing error UI for write failures.
- A comprehensive hook-level integration test for `useLiveItemSync`.
- Migrating the Add Item flow off `updateGroceryListItem` onto the two split writers.

## Further Notes

- The snapshot-rebase rule on autocomplete pick is the subtle piece. The mental model is: "the snapshot represents the saved target the user is committed to." On pick, the user has committed to a different saved item, so the snapshot should align with that target going forward; anything they type *after* the pick is a real diff against the new target and should sync on close.
- The `UnitSheet` fix (don't commit unit when quantity is invalid) is strictly a correctness cleanup; it is included here because this PRD is the first change that relies on "the top-level state is always valid" as an invariant.
- Keeping `updateGroceryListItem` as a wrapper over the two new writers is deliberate: it preserves the Add Item flow's single-call ergonomics and means this PRD does not have to rationalize about the Add path.
