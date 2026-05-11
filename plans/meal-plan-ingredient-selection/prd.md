# Meal Plan Recipe Ingredient Selection

## Problem Statement

When I add a recipe to my meal plan, the app assumes I always want every recipe ingredient later when I send meals to the grocery list. In real life, I often want only a subset (for example, skipping pantry staples I already have, omitting garnishes, or replacing one ingredient with another).  

The current behavior creates extra cleanup work after add-to-list and makes meal planning feel less intentional. I need to decide ingredient-by-ingredient when I place a recipe in the meal plan, keep those choices attached to that planned meal, and have those choices respected when the meal plan is converted into grocery items.

## Solution

When adding a recipe to a meal plan, I can see all recipe ingredients immediately, select which ones I want included, and optionally open a secondary edit surface per ingredient to override details (name, quantity, unit, notes, category, store).  

Those choices are persisted on that specific planned meal through a dedicated child-entity snapshot model. Later, when I add meals to the grocery list (bulk or single-meal quick add), the app projects from that snapshot rather than blindly using the raw recipe ingredients.  

Existing meal-plan recipes that predate this feature are backfilled lazily the first time they are added to the grocery list.

## User Stories

1. As a meal planner, I want to choose ingredients while adding a recipe to the plan, so that I only plan to buy what I actually need.
2. As a meal planner, I want all ingredients selected by default, so that the common case is still fast.
3. As a meal planner, I want to deselect specific ingredient rows, so that I can skip items already in my pantry.
4. As a meal planner, I want to edit a selected ingredient in a second sheet, so that advanced changes do not crowd the primary selection list.
5. As a meal planner, I want to edit name, quantity, unit, notes, category, and store for an ingredient override, so that the planned version matches my real shopping intent.
6. As a meal planner, I want ingredient rows shown in the original recipe order, so that the list is predictable and easy to scan.
7. As a meal planner, I want ingredient choices saved per meal-plan entry, so that the same recipe on different days can have different ingredient selections.
8. As a meal planner, I want to reopen Edit Meal later and revise ingredient choices, so that meal plans stay flexible as plans change.
9. As a meal planner, I want Add-to-List bulk flow to show each meal with an entry point to review/edit that meal’s ingredient selection, so that I can make last-minute adjustments before committing.
10. As a meal planner, I want single-meal quick add to open a quick review modal first, so that I can confirm ingredient selection before adding.
11. As a meal planner, I want quick review to support the same full per-ingredient editing capability, so that it is not a reduced surface.
12. As a meal planner, I want add-to-list to use my saved meal snapshot rather than live recipe ingredients, so that my meal-specific decisions are honored.
13. As a meal planner, I want manually overridden quantities to remain fixed when servings change, so that explicit adjustments are never unexpectedly rescaled.
14. As a meal planner, I want non-overridden ingredients to continue following recipe/servings behavior, so that I retain automatic scaling where I did not customize.
15. As a meal planner, I want recipe-ingredient identity tracked by recipe ingredient id, so that reconciliation remains deterministic.
16. As a meal planner, I want newly added recipe ingredients to auto-include on existing meal entries, so that recipe improvements are picked up without manual migration work.
17. As a meal planner, I want deleted recipe ingredients dropped from meal snapshots, so that stale/orphan rows do not continue to add items unexpectedly.
18. As a meal planner, I want post-add edits to affect future re-adds if I unmark and re-add, so that the meal remains editable over time.
19. As a shopper, I want meal-plan add-to-list to stack normally by matching rules, so that duplicate ingredient entries are combined predictably.
20. As a user with older meal entries, I want backfill to happen automatically when first adding to list, so that older data works without manual repair steps.
21. As a developer, I want ingredient snapshot persistence separated into a focused module with a stable interface, so that reconciliation logic is testable and maintainable.
22. As a developer, I want projection from meal snapshots to grocery add payloads encapsulated in a pure module, so that behavior remains consistent across bulk add and quick add surfaces.

## Implementation Decisions

- Use a new child-entity storage model for meal recipe ingredient snapshots, linked one-to-many from each meal-plan recipe entry.
- Persist full concrete ingredient row values for every snapshot row (not only overrides), with explicit selection represented by selected ingredient IDs.
- Keep snapshot rows associated with source recipe ingredient ids for reconciliation; reconciliation identity is id-only.
- Interpret structural edits as still participating in id-based sync behavior.
- Keep original recipe ordering for display and interaction.
- Add ingredient selection to the add-recipe-to-meal-plan flow as an always-visible inline list.
- Evolve the existing `IngredientSelector` component to support both add-item and meal-plan flows through explicit props/configuration, rather than introducing a compatibility adapter layer.
- Add a secondary ingredient-edit sheet for per-row full-field overrides.
- Extend edit-meal flow to reopen and modify persisted snapshot data at any time.
- Extend add-to-list surfaces:
  - Bulk flow: each meal row can open ingredient review/edit before submission.
  - Quick single-meal flow: open review modal before add; include full editing capability.
- Project grocery add inputs from meal snapshot data, not directly from base recipe ingredients.
- Preserve absolute overridden quantities across servings changes; only non-overridden behavior may rescale.
- Reconcile recipe evolution as follows:
  - New recipe ingredients are auto-included.
  - Deleted recipe ingredients are removed from the snapshot.
- Keep future re-add behavior editable: post-add snapshot changes affect subsequent add attempts when the meal is re-added.
- Change meal-plan add-to-list conflict behavior to normal stacking default.
- Use lazy backfill for legacy meal entries with no snapshot: initialize snapshot on first add-to-list usage.
- Introduce deep modules with stable contracts:
  - **IngredientSelector (shared, extended)**: a single selector component with mode-specific behavior hooks for add-item and meal-plan use cases.
  - **MealPlanIngredientSnapshotStore**: snapshot persistence, reconciliation, and lazy backfill.
  - **MealPlanRecipeIngredientEditor**: shared state + behaviors for checklist and per-row edit sheet.
  - **MealPlanToListProjection**: deterministic conversion from meal snapshots to grocery-item add inputs.

## Testing Decisions

- Good tests assert externally observable behavior and stable contracts, not implementation details or internal state shape.
- Required automated coverage for **MealPlanToListProjection**:
  - selected/unselected filtering behavior
  - override precedence over source recipe values
  - servings interaction (absolute overridden quantities vs non-overridden behavior)
  - reconciliation outcomes for added/removed recipe ingredients
  - stacking payload correctness for downstream grocery add behavior
- Reuse prior art from existing pure transformation/planning tests in the codebase (projection, stacking, and ingredient normalization style tests) for structure and assertion style.
- UI and persistence modules are validated primarily through manual integration for this phase unless scope expands.

## Out of Scope

- Changes to standalone meal-plan items in this phase (recipe meal entries only).
- Replacing or redesigning the full meal planner information architecture.
- New user-level settings for prompt/immediate quick add behavior.
- Non-id-based reconciliation strategies.
- Migration script that eagerly backfills all existing meal entries upfront.
- Redesigning grocery item stacking heuristics beyond adopting the selected default behavior in this feature.

## Further Notes

- This feature intentionally separates “planning-time ingredient intent” from “base recipe definition,” allowing recipes to remain reusable while meal instances stay personalized.
- The chosen child-entity model favors long-term extensibility for future per-ingredient metadata and auditing while keeping core meal-plan recipe rows compact.
