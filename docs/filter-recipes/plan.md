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

- Status: Not Started
- Work:
  - Create `features/recipes/components/meal-tag-filter-selector.tsx`.
  - Reuse dropdown/pill patterns from grocery list selectors.
  - Include "All" plus all meal tag options.
- Validation:
  - Render in isolation and verify selection changes state.

### 3) Build RecipeFilters UI component

- Status: Not Started
- Work:
  - Create `features/recipes/components/recipe-filters.tsx`.
  - Reuse `SearchBar` and integrate `MealTagFilterSelector`.
  - Add sort selector (adapt existing sort selector pattern).
  - Add a "Clear filters" action when filters are active.
- Validation:
  - Manual check: typing, selecting filters, and clearing works.

### 4) Wire filters into recipes screen

- Status: Not Started
- Work:
  - Add filter state to `app/(tabs)/recipes.tsx` (or a dedicated hook).
  - Use `useDeferredValue` for search query and `useMemo` for filtering.
  - Pass filtered list to `RecipeList`.
  - Add result count display and a filtered empty state.
- Validation:
  - Manual check: result count updates, empty state toggles correctly.

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
