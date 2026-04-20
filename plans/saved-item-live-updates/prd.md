# Saved Item Sheet — Live Updates (Edit Mode)

## Problem Statement

Editing a saved item currently requires tapping an explicit `Update` button in the sheet footer to persist changes. This adds friction and creates a failure mode where swipe-dismiss or tap-outside can drop in-progress edits.

We already removed this confirmation step from grocery Edit Item and want the same behavior for saved-items edit mode.

## Solution

When editing an existing saved item, changes persist as they are made. There is no `Update` button and no reserved footer space in edit mode.

- `name` writes are debounced (300ms trailing).
- `category` and `store` writes are immediate.
- Pending text edits flush when the sheet starts closing.
- Sheet reset and snapshot cleanup happen on dismiss.
- Return key blurs keyboard in edit mode (no submit).

Add mode remains unchanged: footer button, submit behavior, and success toast are preserved.

## User Stories

1. As a user editing a saved item, I want edits to save automatically so I do not need a confirmation tap.
2. As a user, I want swipe-dismiss to preserve my latest edit, including pending debounced text.
3. As a user, I want category and store changes to apply immediately.
4. As a user, I want temporary empty-name states to avoid writes until the name is non-empty again.
5. As a user, I want no edit-success toast for each small tweak.
6. As a user, I want the return key to dismiss the keyboard in edit mode, not submit.
7. As a user, I want add-mode behavior unchanged.
8. As a user editing a local saved item, I want first edit to promote it to cloud and continue editing the promoted record seamlessly.

## Implementation Decisions

### Scope

- Only the edit path in `features/saved-items/components/add-saved-item-sheet.tsx` changes to live updates.
- Add path in the same provider stays submit-on-button.

### Write model

- Reuse `updateSavedItem` from `features/saved-items/unified/update-saved-item.ts`.
- Keep local-item promotion behavior; in live mode this can happen on first write.
- After promotion, update in-memory edit context to the new cloud id/source so subsequent live writes target cloud directly.
- No new user-facing error surfaces; rely on existing behavior.

### Timing model

- Debounce `name` only (300ms trailing via `useDebounceCallback`).
- Immediate writes for `category` and `storeId`.
- Guard writes when trimmed `name` is empty.
- On `onStartClose`, flush pending debounced write.
- On `onDismiss`, reset form state and clear live-sync snapshot/baseline refs.

### Sheet semantics

- Edit mode: omit footer button entirely and remove extra footer spacing.
- Add mode: keep existing footer and behavior.
- Edit mode uses `ItemSheetProvider` in `mode="update"` so return key blurs.
- Add mode remains `mode="add"`.

### Concurrency/race handling

- If promotion local->cloud occurs, roll forward the active editing target immediately.
- A small extra write during promotion propagation is acceptable as long as final state is correct and no data loss occurs.
- Live sync writes should always read latest state through refs to avoid stale closures.

## Testing Decisions

Manual validation is sufficient for this change:

- Edit cloud saved item: name/category/store persist live without tapping update.
- Edit local saved item: first write promotes; subsequent edits in same session continue to persist.
- Swipe-dismiss while name debounce is pending: final value persists.
- Temporary empty name: no write until non-empty.
- Edit mode has no footer button and no extra footer space.
- Return key in edit mode blurs keyboard.
- Add mode still shows button/toast and submits as before.

Run:

- `pnpm lint`
- `pnpm tsc --noEmit`

## Out of Scope

- Add mode behavior changes.
- Introducing a new split writer for saved-items.
- Schema/perms changes.
- New toast/error UI for live edit failures.
- Autocomplete behavioral changes (autocomplete is currently disabled in this sheet).
