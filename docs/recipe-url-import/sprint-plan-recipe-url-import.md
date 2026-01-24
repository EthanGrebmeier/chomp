# Recipe URL Import Feature - Sprint Plan

## Overview

Integrate the recipe parsing API to allow users to import recipes from URLs. The API (`EXPO_PUBLIC_API_URL`) parses recipe pages and returns structured ingredient data that can be saved as new recipes.

**API Endpoint**: `POST /api/recipes/ingredients-from-url`  
**Auth**: Clerk Bearer token  
**Response**: `{ sourceUrl, recipeName, servings, ingredients: [{name, quantity, unit, notes, category}] }`

---

## Architecture Decisions

### Data Layer Pattern
Following existing patterns, the feature will use:
- `features/recipes/api/` - API client functions (new directory for external API calls)
- `features/recipes/hooks/` - React hooks wrapping API + mutations
- `features/recipes/components/import/` - UI components for import flow

### Auth Pattern
Use `useAuth().getToken()` from Clerk internally within the hook, matching the pattern in `lib/instant/use-clerk-auth.tsx`. The API client function accepts the token as a parameter, while the hook handles token retrieval.

### State Management
The import flow uses a state machine pattern: `idle → loading → preview → saving → success/error`

---

## Sprint 0: Schema Preparation

### Task 0.1: Add Schema Fields for Recipe Import ✅ COMPLETED (2026-01-24)

**Description**: Add `sourceUrl` and `servings` fields to the `recipes` entity to store import metadata.

**Files**:
- `instant.schema.ts`

**Changes**:
```typescript
recipes: i.entity({
  // ... existing fields
  sourceUrl: i.string().optional(),  // URL the recipe was imported from
  servings: i.string().optional(),   // Serving size info from source
}),
```

**Commands**:
```bash
npx instant-cli push schema --app $EXPO_PUBLIC_INSTANT_APP_ID --token $INSTANT_APP_ADMIN_TOKEN --yes
```

**Validation**:
- Schema push succeeds
- TypeScript types update correctly
- Existing recipes unaffected

**Commit**: `feat(schema): add sourceUrl and servings fields to recipes entity`

---

## Sprint 1: API Client Foundation

**Sprint Goal**: Call the recipe parsing API from a test component and see structured results.

### Task 1.1: Define API Types ✅ COMPLETED (2026-01-24)

**Description**: Create TypeScript types for the recipe parsing API request, response, and errors.

**Files**:
- `features/recipes/api/types.ts` (new)

**Types to Define**:
```typescript
// Request
export type ParseRecipeUrlRequest = {
  url: string;
};

// Response
export type ParseRecipeUrlResponse = {
  sourceUrl: string;
  recipeName: string | null;
  servings: string | null;
  ingredients: ParsedIngredient[];
};

export type ParsedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  category: IngredientCategory;
};

// Re-export from shared category types
import { Category } from '@/features/shared/category/categories';
export type IngredientCategory = Category;

// Errors
export type ParseRecipeUrlErrorCode =
  | 'invalid_url'
  | 'unsupported_content'
  | 'unauthorized'
  | 'not_found'
  | 'fetch_timeout'
  | 'content_too_large'
  | 'parse_failed'
  | 'rate_limited'
  | 'server_error';

export type ParseRecipeUrlError = {
  error: {
    code: ParseRecipeUrlErrorCode;
    message: string;
  };
};

// Rate limit headers
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetSeconds: number;
};
```

**Validation**:
- TypeScript compiles without errors
- Types match API spec in `docs/api-spec-ingredients-from-url.md`

**Commit**: `feat(recipes): define API types for recipe URL parsing`

---

### Task 1.2: Create Error Message Constants ✅ COMPLETED (2026-01-24)

**Description**: Create user-friendly error messages for each API error code.

**Files**:
- `features/recipes/constants/import-errors.ts` (new)

**Content**:
```typescript
import { ParseRecipeUrlErrorCode } from '../api/types';

export const IMPORT_ERROR_MESSAGES: Record<ParseRecipeUrlErrorCode, string> = {
  invalid_url: 'Please enter a valid URL starting with http:// or https://',
  unsupported_content: 'This page doesn\'t appear to contain a recipe',
  unauthorized: 'Please sign in to import recipes',
  not_found: 'The recipe page could not be found',
  fetch_timeout: 'The request timed out. Please try again',
  content_too_large: 'This page is too large to process',
  parse_failed: 'Unable to extract ingredients from this recipe',
  rate_limited: 'Too many requests. Please wait a moment and try again',
  server_error: 'Something went wrong. Please try again later',
};

export const getImportErrorMessage = (code: ParseRecipeUrlErrorCode): string => {
  return IMPORT_ERROR_MESSAGES[code] ?? 'An unexpected error occurred';
};
```

**Validation**:
- All error codes have messages
- Messages are user-friendly and actionable

**Commit**: `feat(recipes): add user-friendly error messages for recipe import`

---

### Task 1.3: Create URL Validation Utility ✅ COMPLETED (2026-01-24)

**Description**: Create a utility function to validate recipe URLs before submission.

**Files**:
- `features/recipes/utils/validate-recipe-url.ts` (new)
- `features/recipes/utils/__tests__/validate-recipe-url.test.ts` (new)

**Implementation**:
```typescript
export type UrlValidationResult = 
  | { valid: true; url: string }
  | { valid: false; error: string };

export const validateRecipeUrl = (input: string): UrlValidationResult => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Please enter a URL' };
  }

  try {
    const url = new URL(trimmed);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
};
```

**Test Cases**:
- Valid https URL
- Valid http URL
- Missing protocol
- Invalid URL format
- Empty string
- Whitespace handling

**Validation**:
- All unit tests pass
- Edge cases covered

**Commit**: `feat(recipes): add URL validation utility for recipe import`

---

### Task 1.4: Create Recipe Parsing API Client ✅ COMPLETED (2026-01-24)

**Description**: Create the API client function that calls the recipe parsing endpoint.

**Files**:
- `features/recipes/api/parse-recipe-url.ts` (new)
- `features/recipes/api/index.ts` (new)

**Implementation**:
```typescript
import {
  ParseRecipeUrlRequest,
  ParseRecipeUrlResponse,
  ParseRecipeUrlError,
  RateLimitInfo,
} from './types';

export class RecipeParseError extends Error {
  code: string;
  rateLimitInfo?: RateLimitInfo;

  constructor(code: string, message: string, rateLimitInfo?: RateLimitInfo) {
    super(message);
    this.name = 'RecipeParseError';
    this.code = code;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export const parseRecipeUrl = async (
  request: ParseRecipeUrlRequest,
  token: string
): Promise<ParseRecipeUrlResponse> => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new RecipeParseError('config_error', 'API URL not configured');
  }

  const response = await fetch(`${apiUrl}/api/recipes/ingredients-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  // Extract rate limit info from headers
  const rateLimitInfo: RateLimitInfo | undefined = response.headers.get('X-RateLimit-Limit')
    ? {
        limit: parseInt(response.headers.get('X-RateLimit-Limit') ?? '30', 10),
        remaining: parseInt(response.headers.get('X-RateLimit-Remaining') ?? '30', 10),
        resetSeconds: parseInt(response.headers.get('X-RateLimit-Reset') ?? '60', 10),
      }
    : undefined;

  if (!response.ok) {
    const errorBody = await response.json() as ParseRecipeUrlError;
    throw new RecipeParseError(
      errorBody.error.code,
      errorBody.error.message,
      rateLimitInfo
    );
  }

  return response.json() as Promise<ParseRecipeUrlResponse>;
};
```

**Validation**:
- Function accepts URL and token
- Returns typed response on success
- Throws `RecipeParseError` with code and message on failure
- Rate limit info extracted from headers

**Commit**: `feat(recipes): add API client for recipe URL parsing`

---

### Task 1.5: Create useParseRecipeUrl Hook ✅ COMPLETED (2026-01-24)

**Description**: Create a React hook that wraps the API client with TanStack Query mutation and handles auth.

**Files**:
- `features/recipes/hooks/useParseRecipeUrl.tsx` (new)
- Update `features/recipes/hooks/index.ts`

**Implementation**:
```typescript
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';

import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { ParseRecipeUrlResponse } from '../api/types';

export const useParseRecipeUrl = () => {
  const { getToken } = useAuth();

  return useMutation<ParseRecipeUrlResponse, RecipeParseError, { url: string }>({
    mutationFn: async ({ url }) => {
      const token = await getToken();
      if (!token) {
        throw new RecipeParseError('unauthorized', 'Not authenticated');
      }
      return parseRecipeUrl({ url }, token);
    },
  });
};
```

**Validation**:
- Hook returns mutation object with `mutate`, `data`, `error`, `isPending`
- Auth token retrieved internally
- Error is typed as `RecipeParseError`

**Commit**: `feat(recipes): add useParseRecipeUrl hook`

---

### Task 1.6: Create Test Screen for API Validation ✅ COMPLETED (2026-01-24)

**Description**: Create a temporary test screen to validate the API integration works end-to-end.

**Files**:
- `app/test-import.tsx` (new, temporary)

**Implementation**:
- Text input for URL
- Button to trigger parse
- Display loading, error, and success states
- Show parsed recipe data as JSON

**Validation**:
- Can enter URL and submit
- Loading state shows during request
- Error messages display correctly
- Success shows parsed recipe data
- Real API call works with valid recipe URL

**Commit**: `feat(recipes): add test screen for recipe URL parsing [temp]`

**Note**: This screen will be removed in Sprint 3 when the real UI is integrated.

---

## Sprint 2: Recipe Import UI Components

**Sprint Goal**: Complete UI flow for recipe import with mock data.

### Task 2.1: Create URL Input Component ✅ COMPLETED (2026-01-24)

**Description**: Create a text input component for entering recipe URLs with validation and clipboard paste.

**Files**:
- `features/recipes/components/import/url-input.tsx` (new)

**Features**:
- Text input with URL keyboard type
- Real-time validation feedback
- Paste from clipboard button
- Clear button
- Keyboard dismissal handling via `KeyboardController`

**Props**:
```typescript
type UrlInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
};
```

**Validation**:
- Component renders correctly
- Paste button reads from clipboard
- Clear button resets input
- Validation error displays below input
- Submit triggers on keyboard "done"

**Commit**: `feat(recipes): add URL input component for recipe import`

---

### Task 2.2: Create Parsed Recipe Preview Component ✅ COMPLETED (2026-01-24)

**Description**: Create a component to display the parsed recipe metadata with editable name.

**Files**:
- `features/recipes/components/import/parsed-recipe-preview.tsx` (new)

**Features**:
- Editable recipe name input
- Display servings (read-only)
- Display source URL (read-only, truncated)
- Ingredient count badge

**Props**:
```typescript
type ParsedRecipePreviewProps = {
  recipeName: string;
  onNameChange: (name: string) => void;
  servings: string | null;
  sourceUrl: string;
  ingredientCount: number;
};
```

**Validation**:
- Name is editable
- Servings and URL display correctly
- Handles null/missing values gracefully

**Commit**: `feat(recipes): add parsed recipe preview component`

---

### Task 2.3: Create Ingredient List Preview Component ✅ COMPLETED (2026-01-24)

**Description**: Create a component to display parsed ingredients with remove capability.

**Files**:
- `features/recipes/components/import/ingredient-list-preview.tsx` (new)

**Features**:
- List of ingredients with quantity, unit, name, notes
- Display category tag using existing `CategoryTag` component
- Remove button per ingredient (swipe or icon)
- Empty state if all removed
- Format: "2 cups flour (sifted)" or "1 chicken breast"

**Props**:
```typescript
type IngredientListPreviewProps = {
  ingredients: ParsedIngredient[];
  onRemove: (index: number) => void;
};
```

**Validation**:
- All ingredients display with correct formatting
- Category tags display with correct styling (using existing `CategoryTag` component)
- Remove works and updates list
- Empty state shows when list is empty
- Handles null quantity/unit gracefully

**Commit**: `feat(recipes): add ingredient list preview component`

---

### Task 2.4: Define Import State Machine Types ✅ COMPLETED (2026-01-24)

**Description**: Define the state machine types and transitions for the import flow.

**Files**:
- `features/recipes/types/import-state.ts` (new)

**States**:
```typescript
export type ImportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: RecipeParseError }
  | { status: 'preview'; data: ParseRecipeUrlResponse; editedName: string; selectedIngredients: ParsedIngredient[] }
  | { status: 'saving' }
  | { status: 'success'; recipeId: string };

export type ImportAction =
  | { type: 'SUBMIT_URL'; url: string }
  | { type: 'PARSE_SUCCESS'; data: ParseRecipeUrlResponse }
  | { type: 'PARSE_ERROR'; error: RecipeParseError }
  | { type: 'EDIT_NAME'; name: string }
  | { type: 'REMOVE_INGREDIENT'; index: number }
  | { type: 'CONFIRM_IMPORT' }
  | { type: 'SAVE_SUCCESS'; recipeId: string }
  | { type: 'SAVE_ERROR'; error: Error }
  | { type: 'RESET' }
  | { type: 'GO_BACK' };
```

**Validation**:
- Types compile correctly
- All states and transitions defined

**Commit**: `feat(recipes): define import state machine types`

---

### Task 2.5: Create useImportRecipeState Hook ✅ COMPLETED (2026-01-24)

**Description**: Create a hook that manages the import state machine.

**Files**:
- `features/recipes/hooks/useImportRecipeState.tsx` (new)

**Implementation**:
- Use `useReducer` with defined state types
- Expose state and dispatch
- Helper methods: `submitUrl`, `editName`, `removeIngredient`, `confirm`, `reset`, `goBack`

**Validation**:
- State transitions work correctly
- Can move through full flow: idle → loading → preview → saving → success

**Commit**: `feat(recipes): add useImportRecipeState hook`

---

### Task 2.6: Create Import Recipe Sheet ✅ COMPLETED (2026-01-24)

**Description**: Create the main bottom sheet component that orchestrates the import flow.

**Files**:
- `features/recipes/components/import/import-recipe-sheet.tsx` (new)

**Features**:
- Uses `BottomSheet` component pattern from existing sheets
- Renders different content based on state:
  - `idle`: URL input
  - `loading`: Loading spinner
  - `error`: Error message with retry
  - `preview`: Recipe preview + ingredient list + confirm button
  - `saving`: Saving indicator
  - `success`: (sheet dismisses)
- Back button to return to URL input from preview
- Exposes `present()` and `dismiss()` via ref

**Validation**:
- Sheet opens and closes correctly
- All states render appropriate content
- Navigation between states works
- Can complete full flow with mock data

**Commit**: `feat(recipes): add import recipe sheet component`

---

## Sprint 3: Full Integration

**Sprint Goal**: End-to-end recipe import working with real API and data persistence.

### Task 3.1: Add Entry Point to Recipes Tab ✅ COMPLETED (2026-01-24)

**Description**: Add an "Import from URL" option accessible from the recipes screen.

**Files**:
- `features/recipes/components/import-recipe-button.tsx` (new)
- Update `app/(tabs)/recipes.tsx`

**Options** (pick one):
- **Option A**: Dropdown menu on existing FAB with "Create" and "Import" options
- **Option B**: Separate smaller button next to FAB
- **Option C**: Menu in header

**Recommended**: Option A - dropdown on FAB, similar to `RecipeDropdownMenu` pattern.

**Validation**:
- Entry point is visible and accessible
- Tapping opens import sheet
- Doesn't disrupt existing create flow

**Commit**: `feat(recipes): add import recipe entry point`

---

### Task 3.2: Create Data Transformation Utility ✅ COMPLETED (2026-01-24)

**Description**: Create a function to transform parsed API data to `CreateRecipeArgs` format.

**Files**:
- `features/recipes/utils/transform-parsed-recipe.ts` (new)
- `features/recipes/utils/__tests__/transform-parsed-recipe.test.ts` (new)

**Implementation**:
```typescript
import { ParseRecipeUrlResponse, ParsedIngredient } from '../api/types';
import { CreateRecipeArgs } from '../instant/create-recipe';

export const transformParsedRecipe = (
  data: ParseRecipeUrlResponse,
  editedName: string,
  selectedIngredients: ParsedIngredient[]
): CreateRecipeArgs => {
  return {
    recipe: {
      name: editedName || data.recipeName || 'Imported Recipe',
      description: '',
      sourceUrl: data.sourceUrl,
      // Note: servings stored in description or new field after schema update
    },
    ingredients: selectedIngredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? 1,
      unit: ing.unit ?? '',
      notes: ing.notes ?? undefined,
      category: ing.category, // Provided by API
    })),
  };
};
```

**Test Cases**:
- Full data transformation
- Null quantity defaults to 1
- Null unit defaults to empty string
- Edited name overrides parsed name
- Empty name fallback to "Imported Recipe"
- Filtered ingredients only
- Category passed through from API

**Validation**:
- All tests pass
- Output matches `CreateRecipeArgs` type

**Commit**: `feat(recipes): add parsed recipe transformation utility`

---

### Task 3.3: Wire Import Sheet to API ✅ COMPLETED (2026-01-24)

**Description**: Connect the import sheet to the real `useParseRecipeUrl` hook.

**Files**:
- Update `features/recipes/components/import/import-recipe-sheet.tsx`

**Changes**:
- Call `useParseRecipeUrl` mutation on URL submit
- Update state machine on success/error
- Pass rate limit info to error display

**Validation**:
- Real API call fires on submit
- Success populates preview state
- Errors display with user-friendly messages
- Rate limit handled gracefully

**Commit**: `feat(recipes): wire import sheet to recipe parsing API`

---

### Task 3.4: Wire Import Confirmation to Recipe Creation ✅ COMPLETED (2026-01-24)

**Description**: On import confirmation, create the recipe using existing `useCreateRecipe` hook.

**Files**:
- Update `features/recipes/components/import/import-recipe-sheet.tsx`

**Changes**:
- Call `transformParsedRecipe` with current state
- Call `useCreateRecipe().mutate()` with transformed data
- Handle success: dispatch `SAVE_SUCCESS` with recipe ID
- Handle error: dispatch `SAVE_ERROR`

**Validation**:
- Confirming import creates recipe in InstantDB
- Recipe appears in recipe list
- Ingredients are attached to recipe
- Source URL and servings stored (if schema updated)

**Commit**: `feat(recipes): wire import confirmation to recipe creation`

---

### Task 3.5: Add Success Flow ✅ COMPLETED (2026-01-24)

**Description**: Handle successful import with navigation and feedback.

**Files**:
- Update `features/recipes/components/import/import-recipe-sheet.tsx`
- May need toast utility (check if exists)

**Changes**:
- On `SAVE_SUCCESS`:
  - Dismiss sheet
  - Show success toast: "Recipe imported successfully"
  - Navigate to new recipe: `router.push(navigation.goToRecipe(recipeId))`
  - Reset state

**Validation**:
- Sheet dismisses on success
- Toast appears
- Navigates to new recipe detail page
- Can import another recipe after

**Commit**: `feat(recipes): add success flow for recipe import`

---

### Task 3.6: Remove Test Screen

**Description**: Remove the temporary test screen created in Sprint 1.

**Files**:
- Delete `app/test-import.tsx`

**Validation**:
- Test screen removed
- No broken imports

**Commit**: `chore(recipes): remove temporary import test screen`

---

## Sprint 4: Error Handling & Polish

**Sprint Goal**: Production-ready feature with polished error handling and edge cases.

### Task 4.1: Implement Error State UI

**Description**: Create a polished error display component for the import sheet.

**Files**:
- `features/recipes/components/import/import-error.tsx` (new)

**Features**:
- Icon indicating error type (e.g., warning, network)
- User-friendly error message from constants
- Retry button for transient errors (timeout, server_error, rate_limited)
- Different action for non-retryable errors (invalid_url → edit URL)

**Validation**:
- Each error code displays correctly
- Retry button calls parse again
- "Edit URL" returns to input state

**Commit**: `feat(recipes): add polished error UI for recipe import`

---

### Task 4.2: Add Loading States

**Description**: Add polished loading indicators during API call and save.

**Files**:
- Update `features/recipes/components/import/import-recipe-sheet.tsx`
- May create `features/recipes/components/import/import-loading.tsx`

**Features**:
- Skeleton or spinner during parse
- "Importing recipe..." text
- Disable interactions during loading
- Optional: Cancel button (aborts fetch)

**Validation**:
- Loading state is visually clear
- UI doesn't flash between states
- Interactions disabled appropriately

**Commit**: `feat(recipes): add polished loading states for recipe import`

---

### Task 4.3: Handle Edge Cases

**Description**: Handle various edge cases in the import flow.

**Cases**:
- Empty ingredient list from API (show warning, allow import anyway)
- Very long recipe name (truncate or allow edit)
- Network offline (detect and show appropriate message)
- Sheet dismissed during loading (cancel request)
- Double-tap prevention on confirm button

**Validation**:
- Each edge case handled gracefully
- No crashes or undefined behavior

**Commit**: `feat(recipes): handle edge cases in recipe import flow`

---

### Task 4.4: Add Rate Limit Handling (Optional/Enhancement)

**Description**: Display rate limit information and handle 429 responses gracefully.

**Features**:
- Show "Retry in X seconds" on rate limit error
- Optional: Display remaining requests in UI
- Disable submit button during cooldown

**Validation**:
- Rate limit error shows countdown
- Can retry after cooldown

**Commit**: `feat(recipes): add rate limit handling for recipe import`

---

## Post-Sprint: Future Enhancements (Not in MVP)

These items are out of scope for the initial implementation but noted for future work:

1. **Inline ingredient editing** - Edit quantity, unit, name in preview
2. **Category override** - Allow user to change auto-assigned category in preview
3. **Duplicate detection** - Warn if recipe name already exists
4. **Batch import** - Import multiple recipes at once
5. **Import history** - Track previously imported URLs
6. **Share extension** - Import from share sheet

---

## File Structure Summary

```
features/recipes/
├── api/
│   ├── index.ts
│   ├── parse-recipe-url.ts
│   └── types.ts
├── components/
│   ├── import/
│   │   ├── import-error.tsx
│   │   ├── import-loading.tsx
│   │   ├── import-recipe-sheet.tsx
│   │   ├── ingredient-list-preview.tsx
│   │   ├── parsed-recipe-preview.tsx
│   │   └── url-input.tsx
│   └── import-recipe-button.tsx
├── constants/
│   └── import-errors.ts
├── hooks/
│   ├── useImportRecipeState.tsx
│   └── useParseRecipeUrl.tsx
├── types/
│   └── import-state.ts
└── utils/
    ├── __tests__/
    │   ├── transform-parsed-recipe.test.ts
    │   └── validate-recipe-url.test.ts
    ├── transform-parsed-recipe.ts
    └── validate-recipe-url.ts
```

---

## Definition of Done

Each task is complete when:
1. Code is written and compiles without errors
2. Specified validation criteria are met
3. No new linter warnings introduced
4. Commit made with conventional commit message
5. Feature works in development build

Each sprint is complete when:
1. All tasks are done
2. Sprint demo goal is achievable
3. No regressions in existing functionality
