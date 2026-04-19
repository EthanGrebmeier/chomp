# Recipe Ingredient Sheet — Live Updates (Edit Mode)

## Problem Statement

When I open an existing recipe ingredient to edit it, I have to change fields and then tap an "Update Ingredient" button at the bottom of the sheet to persist my changes. This is the same friction we just removed from the grocery Edit Item Sheet: adjusting a pill or a quantity should feel like it "just happened," and dismissing the sheet should not silently discard my edits.

The recipe ingredient sheet is currently a single provider (`AddIngredientProvider`) that handles both adding a new ingredient and editing an existing one. Only the edit path has this friction — the add path is intentionally a single-shot flow (submit + keep the sheet open for continuous entry) and should stay that way.

## Solution

The recipe ingredient sheet persists changes as I make them **when I'm editing an existing ingredient**. There is no "Update Ingredient" button in edit mode. I close the sheet by swiping down or tapping outside, and everything I changed is already saved.

Changes to structured fields (category, quantity, unit, store) feel instantaneous. Changes to free-text fields (name, notes) are debounced briefly so we're not writing on every keystroke, but they're committed before the sheet closes no matter when I dismiss.

The Add Ingredient flow is untouched: it keeps its "Add Ingredient" button, its toast, and its sheet-stays-open continuous-entry behavior.

## User Stories

1. As a recipe owner editing an ingredient, I want the edit sheet to save changes as I make them, so that I never have to think about whether I confirmed my edits.
2. As a recipe owner, I want to dismiss the ingredient edit sheet by swiping it down and have my changes persist, so that closing and confirming are the same action.
3. As a recipe owner, I want changes to the quantity pill to apply the moment I confirm them in the quantity sub-sheet, so that I see the new quantity reflected in the ingredient list immediately.
4. As a recipe owner, I want changes to the category and store pills to apply immediately on confirm or clear, so that the ingredient edit sheet behaves consistently across pill controls.
5. As a recipe owner typing in an ingredient name, I want my edits to be committed after I stop typing briefly, so that saved writes don't thrash on every keystroke.
6. As a recipe owner, I want my pending typed edits to still be saved if I dismiss the sheet while the debounce timer is running, so that I don't lose the last few keystrokes by closing too quickly.
7. As a recipe owner, I want the sheet to skip writing when I've temporarily cleared the name field, an invalid quantity, or an empty unit, so that an intermediate invalid state doesn't corrupt the ingredient.
8. As a recipe owner editing notes on an ingredient, I want the notes to save automatically as I type, so that I don't need to hit a button to commit them.
9. As a recipe owner, I want the "Update Ingredient" button removed from the edit sheet, so that I'm not confused about whether I need to tap it.
10. As a recipe owner, I want the "Ingredient updated" success toast removed from the edit flow, so that silent, instant edits don't get announced on every tweak.
11. As a recipe owner picking an ingredient from the autocomplete suggestions while editing, I want the pick to be committed immediately, so that my subsequent edits are diffed against the new chosen values.
12. As a recipe owner picking a match from autocomplete while the debounce timer is counting, I want the autocomplete pick to take precedence and cancel the pending keystroke write, so that I don't get a stale name saved right after I pick a match.
13. As a recipe owner working offline, I want my live edits to be queued by Instant's optimistic pipeline like every other write, so that I don't need new error handling to worry about.
14. As a recipe owner hitting the return key in the ingredient name input, I want the keyboard to dismiss (not the sheet), so that I can keep adjusting pills without closing the sheet. (No change from today.)
15. As a user of the Add Ingredient flow, I want the existing Add Ingredient behavior — the footer button, the toast, the sheet staying open for continuous entry — to remain unchanged, so that this change is scoped to the Edit flow.
16. As a developer extending the ingredient sheet, I want the live-update logic encapsulated in a dedicated hook (mirroring `useLiveItemSync`), so that I can reason about it independently from the shared `useItemSheet` state and from the add path.

## Implementation Decisions

### Scope

- This PRD covers the **edit mode** of `AddIngredientProvider` / `AddIngredientSheet` in `features/recipes/components/add-ingredient-sheet.tsx`. The add mode is intentionally unchanged.
- Recipe ingredients do not link to `saved_items`, so there is no close-time cross-entity sync. Writes are purely to the `recipe_ingredients` row and the `recipe_ingredients ↔ stores` link.

### Behavior — timing model

- In edit mode only, the sheet owns a single live-write pathway. There is no deferred close-time sync (unlike grocery) because ingredients don't have a shared saved-item layer.
- Text fields (`name`, `notes`) go through a 300ms trailing debounce.
- Non-text fields (`category`, `quantity`, `unit`, `storeId`) fire an immediate live write on change. Sub-sheet confirm buttons gate validity for quantity/unit/category/store, so the top-level state only ever transitions between valid values.
- Pill "clear" affordances (category and store) fire immediate live writes because they bypass the confirm sub-sheet.
- If the sheet begins closing while a debounce timer is pending, the pending write is flushed synchronously before dismissal completes.
- Live writes are gated by the same `isValid` rule the footer button used to enforce: non-empty trimmed `name`, truthy `quantity`, truthy `unit`. If the form is ever not-valid, the live write path is skipped until it's valid again.
- No success toast is shown in edit mode.

### Behavior — autocomplete pick

- Picking a match from the autocomplete dropdown cancels any pending text-field debounce.
- A pick immediately triggers a single live write that updates the ingredient's `name`/`category`/`notes`/`storeId` (plus any `unit` carried on the match), preserving the form's current `quantity`. No `saved_items` relink is performed — recipe ingredients don't link to `saved_items`.
- After a pick, the diff snapshot is **rebased** to the picked values. Subsequent edits diff against the new target.

### Behavior — dismiss semantics

- There is no "Update Ingredient" button in edit mode. Users dismiss the sheet by swipe or tap-outside.
- `onStartClose` is the hook point for the debounce flush.
- `onDismiss` (after the sheet is fully closed) is the hook point for state reset and clearing the snapshot ref.
- Hitting return in the name input blurs the input (dismisses the keyboard) and does not dismiss the sheet or fire any special flush; the debounce effect already handles the pending write. This matches today's behavior and the grocery edit sheet.

### Behavior — race handling

- Sheet state is initialized once from the ingredient at `present(ingredient)` time. Subsequent Instant query updates are not re-applied to the edit form, so the user's in-progress edits cannot be clobbered by incoming live data. (Existing behavior.)

### Modules — new

All new modules live in `features/recipes/components/edit-ingredient/`:

- **`diff-ingredient-snapshot.ts`** — pure diff helper. Exports an `IngredientSnapshot` type (`name`, `category?`, `notes?`, `quantity`, `unit`, `storeId?`) and a `diffIngredientSnapshot({ snapshot, current })` function using trim-normalized string comparison and numeric quantity equality. May delegate to / wrap `components/item-sheet/diff-item-snapshot.ts` since the field shape is identical; the file exists so the edit-ingredient subfolder is self-contained.
- **`use-live-ingredient-sync.ts`** — hook composed into the edit sheet. Owns the snapshot lifecycle (capture on present, rebase on pick, clear on dismiss), drives live writes from the shared item-sheet state, and exposes an imperative handle `{ captureSnapshot, flush, clearSnapshot, onPickMatch }` to the sheet.
- **`edit-ingredient-live-sync.tsx`** — null-rendering consumer that runs `useLiveIngredientSync` inside `ItemSheetProvider` (where form state is accessible) and publishes its handle on a ref owned by the provider.

### Modules — modified

- **`features/recipes/components/add-ingredient-sheet.tsx`**:
  - `AddIngredientProvider` owns a `liveSyncRef` and conditionally renders `<EditIngredientLiveSync />` inside `ItemSheetProvider` when `isEditing`.
  - In edit mode, `onSubmit` becomes a no-op (live writes handle persistence); the `toast.success('Ingredient updated')` and manual `sheetRef.current?.dismiss()` are removed from the edit branch. Add mode's `onSubmit` is unchanged.
  - The footer "Add/Update Ingredient" button renders only when `!isEditing`.
  - `onStartClose` flushes `liveSyncRef.current?.flush()` first when editing, then `reset()`. Add-mode path is unchanged.
  - `onDismiss` is added: when editing, it calls `reset()` and `liveSyncRef.current?.clearSnapshot()`.
  - `ItemSheetProvider` receives an `onPickMatch={(match) => liveSyncRef.current?.onPickMatch(match)}` prop only when editing.
  - `present(ingredient)` (edit path) calls `liveSyncRef.current?.captureSnapshot(ingredient)` after `setFromItemRef.current?.(...)` and before `sheetRef.current?.present()`, so the snapshot baseline is set before the first live write can fire.

### Data — writer

- `updateRecipeIngredient` (existing) is reused as-is. No `updateRecipeIngredientOnly` split is introduced because recipe ingredients don't link to `saved_items`; there's nothing to separate out.
- The hook always passes `currentStoreId` from its own tracked baseline so `linkStoreToIngredient` reconciliation is correct across successive live writes. The hook updates its `currentStoreId` baseline after each successful write that changed `storeId`.

### Error handling

- Live writes do not introduce new error handling. They rely on Instant's optimistic UI and offline queue, consistent with the rest of the app's write path and with the grocery edit flow.

### Debounce

- The hook uses `useDebounceCallback` from `usehooks-ts` (already a dependency) with a 300ms delay and trailing edge, exposing its `flush` and `cancel` controls for the close-time flush and autocomplete cancel respectively.

### Scope of change

- Edit mode of the recipe ingredient sheet only. Add mode is intentionally unchanged, including its footer button, its toast, and its sheet-stays-open continuous-entry UX.

## Testing Decisions

No new tests are required for this change. The live-sync pattern is already validated in the grocery edit sheet, and the recipe ingredient port is a structural mirror against a simpler data model (no `saved_items` layer). Manual testing through the edit flow is sufficient.

If a later ticket wants coverage, the natural targets are:

- `diffIngredientSnapshot` (pure) — same shape as the existing `diffItemSnapshot` tests would cover.
- A hook-level integration test for `useLiveIngredientSync` that exercises debounce + flush + pick rebase against a stubbed `updateRecipeIngredient`.

## Out of Scope

- The Add Ingredient flow's submit pattern, toast, and sheet-stays-open behavior.
- Introducing an `updateRecipeIngredientOnly` split writer.
- Adding a `saved_items` relationship to `recipe_ingredients`.
- Any schema or permission changes in Instant.
- New user-facing error UI for write failures.
- Migrating the Add Ingredient flow onto a live-write pathway.
- Reordering support for recipe ingredients (`order` field is unused by this sheet today).

## Further Notes

- The snapshot-rebase rule on autocomplete pick follows the same mental model as grocery: the snapshot represents the target the user is committed to; after a pick the user is committed to the picked values, so the snapshot rebases and anything typed after the pick is a real diff against the new target.
- `updateRecipeIngredient` performs two separate `db.transact` calls when `storeId` changes (scalar update + store link reconcile). This is the same behavior as today's submit-button path; live writes inherit it. If rapid successive store changes ever feel laggy, an `updateRecipeIngredient` refactor can be done independently of this PRD.
- Keeping `AddIngredientProvider` unified (rather than splitting into separate Add and Edit providers) is deliberate: the edit-only behavior is cleanly conditional on `isEditing`, and splitting would force duplicate wiring of `ItemSheetProvider`, `ItemForm`, and `BottomSheet` for little structural gain.
