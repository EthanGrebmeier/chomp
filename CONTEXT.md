# Grocery List Collaboration

This context defines shared language for planning and implementing collaborative grocery list behavior in the app. It focuses on user-facing grocery workflows rather than technical implementation details.

## Language

**Bulk Selection Mode**:
A temporary list interaction mode where users select multiple grocery items for one follow-up action.
_Avoid_: Edit mode, multiselect screen

**Selectable Item**:
An unchecked grocery item that can be included in a bulk action.
_Avoid_: Active row, candidate item

**Checked Item**:
A completed grocery item that is excluded from bulk selection mode.
_Avoid_: Selectable completed item

**Selection Checkbox**:
The existing item checkbox repurposed in Bulk Selection Mode to add or remove a Selectable Item from the current selection.
_Avoid_: Secondary selector, new bulk toggle

**Moved Item State**:
The item status is preserved when moved between grocery lists.
_Avoid_: Reset-on-move behavior

**Move Merge Rule**:
When a moved item matches an existing destination item, quantities are merged instead of creating a duplicate row.
_Avoid_: Duplicate-on-move behavior

**Selection Reset Rule**:
Leaving Bulk Selection Mode clears all currently selected items.
_Avoid_: Sticky selection across mode sessions

**Action Availability Rule**:
Bulk toolbar actions remain disabled until at least one Selectable Item is selected.
_Avoid_: Zero-selection action triggers

**Post-Action Exit Rule**:
After a successful bulk action, Bulk Selection Mode exits immediately.
_Avoid_: Stay-in-mode after apply

**Section Clear Suppression**:
Section-level clear actions are hidden while Bulk Selection Mode is active.
_Avoid_: Parallel destructive actions during selection mode

**Selection-Only Row Behavior**:
Item rows and checkboxes toggle selection in Bulk Selection Mode, and item editing is unavailable.
_Avoid_: Mixed select-and-edit interactions

**Best-Effort Saved Item Sync**:
Bulk store/category updates always update selected grocery items and attempt linked saved-item updates when possible, without blocking overall success.
_Avoid_: All-or-nothing sync requirement

**Best-Effort Recipe Ingredient Sync**:
Bulk store/category updates also attempt to propagate to recipe ingredients for recipe-linked items when an ingredient can be matched, without blocking overall success.
_Avoid_: Failing the whole bulk action on partial recipe-sync errors

**Bulk Recipe Ingredient Match Rule**:
A recipe ingredient is considered the same ingredient for bulk propagation when it shares the selected grocery item's pre-edit name and unit (normalized), and all matches are updated.
_Avoid_: Guessing by partial name only or selecting a single arbitrary match

**Bulk Delete Confirmation**:
Bulk delete requires explicit confirmation before applying the delete action.
_Avoid_: One-tap destructive bulk delete

**Mode Entry/Exit Control**:
The overflow menu only offers entering Bulk Selection Mode; while active, the menu is replaced by an X control that exits the mode.
_Avoid_: In-menu exit action during active mode

**Checked Section Visibility Rule**:
Checked items are completely hidden while Bulk Selection Mode is active.
_Avoid_: Showing completed rows during selection mode

**True Move Rule**:
Bulk move always removes selected source items from the current list after destination application, including merge cases.
_Avoid_: Copy semantics for move

**Selection Utilities Placement**:
Select All and Clear All controls appear in the header next to the mode-exit X while Bulk Selection Mode is active.
_Avoid_: Utility actions hidden in overflow or far from exit control

**Bulk Clear Field Rule**:
Choosing None in bulk Set Store or Set Category clears that field on all selected items.
_Avoid_: Separate clear actions for bulk metadata updates

**Move Target Visibility Rule**:
The current list stays visible in move target selection but is disabled as a destination.
_Avoid_: Hiding current-list context in move sheet

**Bottom Control Transition Rule**:
Bottom nav/add controls and the bulk toolbar cross-fade over about 200ms when mode changes.
_Avoid_: Abrupt swaps or slow transition lag

**Bulk Success Feedback Rule**:
Successful bulk actions show a simple generic success toast without sync-detail breakdown.
_Avoid_: Silent success or overly detailed result toasts

**Toolbar Action Order Rule**:
Bulk toolbar actions are ordered as Set Store, Set Category, Move, then Delete (destructive last).
_Avoid_: Leading destructive action placement

## Relationships

- **Bulk Selection Mode** includes only **Selectable Items**
- A **Checked Item** is never a **Selectable Item** in **Bulk Selection Mode**
- The **Selection Checkbox** acts on exactly one **Selectable Item** at a time
- A **Selectable Item** keeps its **Moved Item State** when moved to another list
- **Move Merge Rule** resolves destination conflicts by incrementing an existing item
- **Selection Reset Rule** applies whenever Bulk Selection Mode exits
- **Action Availability Rule** gates all bulk toolbar actions on non-empty selection
- **Post-Action Exit Rule** exits mode after successful delete, set store, set category, or move
- **Section Clear Suppression** removes per-section clear controls during Bulk Selection Mode
- **Selection-Only Row Behavior** prevents edit-sheet entry while Bulk Selection Mode is active
- **Best-Effort Saved Item Sync** allows partial saved-item sync without failing the bulk grocery-item update
- **Best-Effort Recipe Ingredient Sync** allows partial recipe-ingredient sync without failing the bulk grocery-item update
- **Bulk Recipe Ingredient Match Rule** matches by pre-edit normalized name and unit and updates all matching recipe ingredients
- **Bulk Delete Confirmation** gates destructive bulk delete with user confirmation
- **Mode Entry/Exit Control** exposes entry through menu and exit through a dedicated X icon
- **Checked Section Visibility Rule** hides all checked rows during Bulk Selection Mode
- **True Move Rule** removes source rows after move, regardless of destination merge outcome
- **Selection Utilities Placement** keeps bulk utility controls adjacent to mode exit
- **Bulk Clear Field Rule** applies a None selection as field-clearing across selected rows
- **Move Target Visibility Rule** keeps current list visible but not selectable as a move destination
- **Bottom Control Transition Rule** animates mode changes with a short cross-fade
- **Bulk Success Feedback Rule** confirms completion with concise user feedback
- **Toolbar Action Order Rule** places delete as the right-most action in the bulk toolbar

## Example dialogue

> **Dev:** "In **Bulk Selection Mode**, should a **Checked Item** appear as selectable?"
> **Domain expert:** "No, only **Selectable Items** are included, and the existing **Selection Checkbox** controls selection."

## Flagged ambiguities

- "checkbox" could mean completion state or selection intent — resolved: in **Bulk Selection Mode**, the existing checkbox means selection.
- "edit mode" was used for this flow — resolved canonical term: **Bulk Selection Mode**.
