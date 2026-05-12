# Grocery List Bulk Selection Mode

## Problem Statement

When managing a long grocery list, users currently act on one item at a time. This makes common cleanup and organization tasks slow: deleting many items, changing store/category on multiple rows, or moving items between lists requires repetitive item-by-item interaction.

The grocery list also lacks a dedicated selection mode that clearly separates everyday interactions from bulk operations. Users need a focused workflow where they can quickly select multiple unchecked items, run one bulk action, and return to normal list usage with minimal friction.

## Solution

Introduce a dedicated **Bulk Selection Mode** for the grocery list, entered from the overflow menu. In this mode, users can select unchecked items using the existing checkbox and row taps, then apply one bulk action from a centered bottom toolbar:

- Set Store
- Set Category
- Move to another grocery list
- Delete

When mode is active, normal bottom controls (nav cluster and add button) fade out and the bulk toolbar fades in at the same alignment zone. Checked items are hidden, per-section clear controls are hidden, editing is disabled, and the header exposes exit (`X`) plus selection utilities (`Select All` / `Clear All`).

Bulk actions exit mode on success and show simple generic success toasts.

## User Stories

1. As a shopper, I want to enter bulk selection from the list menu, so that I can intentionally switch into batch-edit behavior.
2. As a shopper, I want the mode to only include unchecked items, so that I focus on active shopping work.
3. As a shopper, I want checked items hidden during bulk mode, so that the view is uncluttered.
4. As a shopper, I want the existing checkbox to become the selection control in bulk mode, so that I do not learn a second selection affordance.
5. As a shopper, I want tapping a row to toggle selection in bulk mode, so that selecting many items is fast.
6. As a shopper, I want item editing disabled while bulk mode is active, so that selection and editing do not conflict.
7. As a shopper, I want list section clear actions hidden in bulk mode, so that destructive actions are centralized and explicit.
8. As a shopper, I want bottom nav/add controls to fade away and the bulk toolbar to fade in, so that mode change feels clear and polished.
9. As a shopper, I want transition timing to feel quick and smooth, so that toggling mode does not feel laggy.
10. As a shopper, I want toolbar actions disabled until I select at least one item, so that I avoid empty-state action attempts.
11. As a shopper, I want `Select All` and `Clear All` in the header while bulk mode is active, so that bulk utilities are easy to reach.
12. As a shopper, I want to exit mode via a prominent `X`, so that leaving mode is always obvious.
13. As a shopper, I want filter/sort/grouping controls to stay available in bulk mode, so that I can keep organizing the current view while selecting.
14. As a shopper, I want the overflow menu to show only the "enter" option when not in mode, so that entry behavior is unambiguous.
15. As a shopper, I want bulk delete to ask for confirmation, so that accidental multi-delete is prevented.
16. As a shopper, I want bulk set store to reuse the existing store sheet, so that behavior stays consistent with item-level editing.
17. As a shopper, I want bulk set category to reuse the existing category sheet, so that behavior stays consistent with item-level editing.
18. As a shopper, I want bulk move to reuse the existing list-selection sheet, so that list-picking feels familiar.
19. As a shopper, I want selecting `None` for store or category to clear that field on all selected items, so that removal is as easy as assignment.
20. As a shopper, I want the move destination list to show my current list as disabled, so that I keep orientation without invalid selection.
21. As a shopper, I want move behavior to be true transfer (remove from source), so that "move" does not create duplicates in my current list.
22. As a shopper, I want move conflicts in destination to merge/increment existing quantities, so that target lists stay clean.
23. As a shopper, I want moved item checked-state semantics preserved, so that transfer logic stays predictable.
24. As a shopper, I want mode selection cleared when I exit mode, so that stale selections do not cause accidental actions later.
25. As a shopper, I want successful bulk actions to exit mode automatically, so that I return to normal browsing immediately.
26. As a shopper, I want a simple success toast after bulk actions, so that I get confirmation without noisy detail.
27. As a shared-list collaborator, I want bulk actions to respect list permissions, so that operations remain safe in collaborative contexts.
28. As a user with linked saved items, I want store/category bulk updates to sync saved items when possible, so that template data stays aligned with my edits.
29. As a user with mixed linkage states, I want saved-item sync to be best-effort, so that bulk item updates still succeed even if some linked syncs are skipped.
30. As a design-conscious user, I want clear iconography on bulk actions, so that each action is recognizable at a glance.
31. As a user switching frequently between actions, I want destructive action placed last in the toolbar, so that accidental destructive taps are less likely.

## Implementation Decisions

- Add a dedicated bulk-selection state machine to the grocery list experience (inactive, active-with-selection tracking).
- Restrict selectable set to unchecked grocery items only; hide checked rows entirely while mode is active.
- Repurpose current row interactions in mode:
  - Checkbox toggles selection.
  - Row press toggles selection.
  - Edit entry points are suppressed.
- Replace active-mode header controls:
  - Hide overflow menu.
  - Show close (`X`) control.
  - Keep filter/sort/grouping dropdown available.
  - Show `Select All` / `Clear All` in the left header slot.
- Hide section-level clear controls while mode is active.
- Replace bottom controls through cross-fade transition (~200ms):
  - Fade out nav cluster and add-item button.
  - Fade in centered bulk toolbar at corresponding bottom alignment.
- Bulk toolbar actions and order (left to right):
  1. Set Store
  2. Set Category
  3. Move
  4. Delete
- Use Lucide icons for toolbar actions:
  - Set Store: `Store`
  - Set Category: `Tags`
  - Move: `ArrowRightLeft`
  - Delete: `Trash2`
- Keep toolbar actions disabled until at least one item is selected.
- Reuse existing sheets/components for action inputs:
  - Existing Store selection sheet.
  - Existing Category selection sheet.
  - Existing grocery-list selection sheet for move target.
- Bulk set-store/category behavior:
  - Apply to all selected grocery items.
  - Treat `None` as clear-field.
  - Attempt linked saved-item sync on a best-effort basis; do not fail the overall bulk operation when some syncs are not possible.
- Bulk move behavior:
  - Keep current list visible but disabled in destination picker.
  - On destination conflict, merge/increment quantity.
  - Always remove source items after successful destination application (true move semantics).
- Bulk delete behavior:
  - Require confirmation with selected-count context.
  - Apply existing soft-delete semantics used for grocery items.
- Post-action behavior:
  - Exit bulk mode on success.
  - Clear selection state.
  - Show concise generic success toast (no sync-detail breakdown).
- Preserve permission boundaries for all writes in shared-list scenarios.
- Introduce deep modules with stable interfaces for maintainability:
  - Bulk selection state controller (mode, selection, select-all/clear-all).
  - Bulk action orchestrator (delete/store/category/move flows + post-action lifecycle).
  - Bulk write adapter for grocery item updates and best-effort saved-item synchronization.

## Testing Decisions

- Good tests validate user-visible behavior and stable module contracts, not internal implementation structure.
- Prioritize isolated unit tests for deep logic modules:
  - Selection controller rules (unchecked-only scope, select-all/clear-all, reset-on-exit).
  - Bulk action orchestrator outcomes (action enablement, confirmation requirements, exit-on-success).
  - Move planning logic (destination merge/increment and source removal semantics).
  - Best-effort saved-item sync behavior (partial sync does not block grocery-item success).
- Add integration-focused UI tests for critical interaction flows:
  - Mode entry from menu and exit via `X`.
  - Checked rows hidden in mode.
  - Bottom controls cross-fade and toolbar visibility.
  - Disabled action states with zero selection.
  - Confirmation gate for delete.
  - Reused sheets wired to bulk actions.
- Reuse prior art from existing list action tests and pure planning/projection test patterns already used for grocery/meal-planner transformations.
- Manual validation checklist should include shared-list permission scenarios and mixed saved-item linkage cases.

## Out of Scope

- Any changes to single-item edit UX outside bulk mode.
- Redesign of grocery list grouping/sorting behavior beyond temporary mode-specific visibility rules.
- Undo stack or action history for bulk actions.
- New custom sheet components for store/category/list picking (existing sheets are reused).
- Schema redesign specifically for bulk mode.
- Bulk editing of fields other than store/category and move/delete.
- Per-item conflict-resolution UI during move (initial behavior is deterministic merge/increment rule).

## Further Notes

- This PRD defines behavior only; implementation is intentionally deferred.
- The canonical term is **Bulk Selection Mode** (not “edit mode”) to avoid ambiguity with existing item-edit surfaces.
- The design intentionally centralizes destructive behavior and keeps delete right-most for safety.
