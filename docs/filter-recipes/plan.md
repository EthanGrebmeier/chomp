# PRD: Recipe Search and Filters

## Goal

Add fast, user-friendly searching and filtering to the recipes tab so users can
quickly find recipes by name, description, ingredient, or meal type.

## Scope

- Search by recipe name, description, and ingredient names (case-insensitive).
- Filter by meal tag (Breakfast, Lunch, Dinner, Snack, Dessert, All).
- Sort by name (A-Z) and recency (created/updated).
- Show result count and empty states for filtered results.

## Non-Goals

- Server-side search or schema changes.
- Persisting filters across app restarts (optional follow-up).

## Assumptions

- Filtering happens client-side using existing recipe data.
- UI components should reuse existing patterns (SearchBar, Pill, dropdowns).
- Tests are added for pure filtering logic.

## Sprint Tasks / Tickets

### 1) Build recipe filtering utility + tests

- Status: Done
- Work:
  - Add `features/recipes/utils/filter-recipes.ts` with typed filter params.
  - Implement search across name, description, and ingredient names.
  - Implement mealTag filter and sort options (name A-Z, recent).
  - Handle optional fields safely (null/undefined).
- Validation:
  - Add `features/recipes/utils/__tests__/filter-recipes.test.ts`.
  - Tests cover: search, mealTag, combined filters, sort, empty inputs.

### 2) Add meal tag filter selector component

- Status: Done
- Work:
  - Create `features/recipes/components/meal-tag-filter-selector.tsx`.
  - Reuse dropdown/pill patterns from grocery list selectors.
  - Include "All" plus all meal tag options.
- Validation:
  - Not run (component not yet wired into a screen).

### 3) Build RecipeFilters UI component

- Status: Done
- Work:
  - Create `features/recipes/components/recipe-filters.tsx` with search + selectors.
  - Add `RecipeSortBySelector` following dropdown/pill pattern.
  - Remove "Clear filters" action; rely on per-pill clear affordances.
- Validation:
  - Not run (component not yet wired into a screen).

### 4) Wire filters into recipes screen

- Status: Done
- Work:
  - Added filter state to `app/(tabs)/recipes.tsx`.
  - Used `useDeferredValue` for search/filters and `useMemo` for filtering.
  - Passed filtered list to `RecipeList`.
  - Added result count display and a filtered empty state.
- Validation:
  - `pnpm tsc` (fails due to existing repo errors).

### 5) QA and validation checklist

- Status: Not Started
- Work:
  - Search by name, description, ingredient name.
  - Filter by each mealTag; combine search + mealTag.
  - Verify sort options (A-Z and recent).
  - Test empty states (no recipes vs no matches).
  - Performance sanity check with large list.
- Validation:
  - Demo run in simulator/device with real data.
