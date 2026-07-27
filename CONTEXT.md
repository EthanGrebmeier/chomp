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
Bulk toolbar item actions (Set Store, Set Category, Move, Delete) remain disabled until at least one Selectable Item is selected. Exit stays enabled regardless of selection count.
_Avoid_: Zero-selection action triggers for item-mutating actions

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
The overflow menu stays available in Bulk Selection Mode and toggles between Select Items (enter) and Exit Bulk Select (exit). An X exit control also appears as the leftmost action on the bulk toolbar.
_Avoid_: Replacing the overflow menu with a header-only exit control

**Checked Section Visibility Rule**:
Checked items are completely hidden while Bulk Selection Mode is active.
_Avoid_: Showing completed rows during selection mode

**True Move Rule**:
Bulk move always removes selected source items from the current list after destination application, including merge cases.
_Avoid_: Copy semantics for move

**Selection Utilities Placement**:
Select All and Clear All controls appear in the header while Bulk Selection Mode is active.
_Avoid_: Utility actions hidden in overflow

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
Bulk toolbar actions are ordered as Exit, Set Store, Set Category, Move, then Delete (destructive last).
_Avoid_: Leading destructive action placement

**Meal Plan View Mode**:
The meal planner supports two top-level presentations of the same schedule data: Calendar View and Day List View.
_Avoid_: Separate datasets per view

**Meal Plan Day List Window Rule**:
Day List View uses the same rolling 61-day planning window as Calendar View (30 days before today through 30 days after today).
_Avoid_: A shorter or different day range in list mode

**Meal Plan Day List Density Rule**:
In Day List View, days with no meals render as compact tappable day rows rather than hidden or expanded sections.
_Avoid_: Auto-expanding empty days on scroll

**Meal Plan Day List Section Stability Rule**:
Day sections in Day List View are never collapsible and always render their full meal contents.
_Avoid_: Accordion behavior, scroll-triggered expansion, or partial section rendering

**Meal Plan Day Tap Add Rule**:
In Day List View, tapping a day header opens Add to Meal Plan with that day preselected, regardless of whether the day currently has meals.
_Avoid_: Restricting tap-to-add only to empty days

**Meal Plan Day List Initial Position Rule**:
When Day List View opens, the list initializes with Today as the topmost visible row instead of scrolling after render.
_Avoid_: Post-render auto-scroll behavior for initial positioning

**Meal Plan Today Indicator Rule**:
Day List View marks Today with a dedicated visual indicator, without maintaining a moving "active day" highlight while scrolling.
_Avoid_: Sticky active-day state tied to viewport position

**Meal Plan View Preference Persistence Rule**:
Meal planner reopens in the last view mode the user selected (Calendar or Day List) via local per-user persistence.
_Avoid_: Resetting to Calendar every time the screen remounts

**Meal Plan View Toggle Control Rule**:
The meal planner header uses one compact icon button beside overflow actions to switch between Calendar and Day List views.
_Avoid_: Wide segmented controls in the header action area

**Meal Plan View Toggle Icon Semantics Rule**:
The header toggle icon represents the target view mode that will be activated when tapped.
_Avoid_: Showing the currently active mode icon on the toggle

## Relationships

- **Bulk Selection Mode** includes only **Selectable Items**
- A **Checked Item** is never a **Selectable Item** in **Bulk Selection Mode**
- The **Selection Checkbox** acts on exactly one **Selectable Item** at a time
- A **Selectable Item** keeps its **Moved Item State** when moved to another list
- **Move Merge Rule** resolves destination conflicts by incrementing an existing item
- **Selection Reset Rule** applies whenever Bulk Selection Mode exits
- **Action Availability Rule** gates item-mutating bulk toolbar actions on non-empty selection while keeping exit enabled
- **Post-Action Exit Rule** exits mode after successful delete, set store, set category, or move
- **Section Clear Suppression** removes per-section clear controls during Bulk Selection Mode
- **Selection-Only Row Behavior** prevents edit-sheet entry while Bulk Selection Mode is active
- **Best-Effort Saved Item Sync** allows partial saved-item sync without failing the bulk grocery-item update
- **Best-Effort Recipe Ingredient Sync** allows partial recipe-ingredient sync without failing the bulk grocery-item update
- **Bulk Recipe Ingredient Match Rule** matches by pre-edit normalized name and unit and updates all matching recipe ingredients
- **Bulk Delete Confirmation** gates destructive bulk delete with user confirmation
- **Mode Entry/Exit Control** toggles enter/exit in the overflow menu and places an X exit on the bulk toolbar
- **Checked Section Visibility Rule** hides all checked rows during Bulk Selection Mode
- **True Move Rule** removes source rows after move, regardless of destination merge outcome
- **Selection Utilities Placement** keeps Select All / Clear All in the header during Bulk Selection Mode
- **Bulk Clear Field Rule** applies a None selection as field-clearing across selected rows
- **Move Target Visibility Rule** keeps current list visible but not selectable as a move destination
- **Bottom Control Transition Rule** animates mode changes with a short cross-fade
- **Bulk Success Feedback Rule** confirms completion with concise user feedback
- **Toolbar Action Order Rule** places exit first and delete as the right-most action in the bulk toolbar
- **Meal Plan View Mode** keeps Calendar View and Day List View as alternate renderings of the same meal plan data
- **Meal Plan Day List Window Rule** keeps Day List View and Calendar View aligned to the same 61-day date window
- **Meal Plan Day List Density Rule** keeps empty days compact but tappable in Day List View
- **Meal Plan Day List Section Stability Rule** keeps all day sections fully expanded and non-collapsible
- **Meal Plan Day Tap Add Rule** lets any day header open Add to Meal Plan for that specific date
- **Meal Plan Day List Initial Position Rule** initializes Day List View with Today at the top
- **Meal Plan Today Indicator Rule** highlights Today only, not a scroll-driven active day
- **Meal Plan View Preference Persistence Rule** restores the user’s previously selected meal-plan view mode
- **Meal Plan View Toggle Control Rule** keeps view switching as a single compact header icon control
- **Meal Plan View Toggle Icon Semantics Rule** shows the destination view icon on the toggle button

## Example dialogue

> **Dev:** "In **Bulk Selection Mode**, should a **Checked Item** appear as selectable?"
> **Domain expert:** "No, only **Selectable Items** are included, and the existing **Selection Checkbox** controls selection."

## Flagged ambiguities

- "checkbox" could mean completion state or selection intent — resolved: in **Bulk Selection Mode**, the existing checkbox means selection.
- "edit mode" was used for this flow — resolved canonical term: **Bulk Selection Mode**.
