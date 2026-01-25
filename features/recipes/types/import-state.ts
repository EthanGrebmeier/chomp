import { RecipeParseError } from '../api/parse-recipe-url';
import { ParsedIngredient, ParseRecipeUrlResponse } from '../api/types';

/**
 * Import flow states:
 * - idle: Initial state, URL input visible
 * - loading: Parsing recipe URL
 * - error: Parse failed, showing error with retry option
 * - preview: Showing parsed recipe for review
 * - saving: Creating recipe in database
 * - success: Recipe created successfully
 */
export type ImportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: RecipeParseError }
  | {
      status: 'preview';
      data: ParseRecipeUrlResponse;
      editedName: string;
      ingredients: ParsedIngredient[];
      selectedIndices: Set<number>;
    }
  | { status: 'saving' }
  | { status: 'success'; recipeId: string };

/**
 * Actions that can be dispatched to transition between states.
 */
export type ImportAction =
  | { type: 'SUBMIT_URL'; url: string }
  | { type: 'PARSE_SUCCESS'; data: ParseRecipeUrlResponse }
  | { type: 'PARSE_ERROR'; error: RecipeParseError }
  | { type: 'EDIT_NAME'; name: string }
  | { type: 'TOGGLE_INGREDIENT'; index: number }
  | { type: 'TOGGLE_ALL_INGREDIENTS' }
  | { type: 'UPDATE_INGREDIENT'; index: number; ingredient: ParsedIngredient }
  | { type: 'CONFIRM_IMPORT' }
  | { type: 'SAVE_SUCCESS'; recipeId: string }
  | { type: 'SAVE_ERROR'; error: Error }
  | { type: 'RESET' }
  | { type: 'GO_BACK' };

/**
 * Initial state for the import flow.
 */
export const initialImportState: ImportState = { status: 'idle' };
