import { useCallback, useReducer } from 'react';

import { RecipeParseError } from '../api/parse-recipe-url';
import { ParseRecipeUrlResponse } from '../api/types';
import {
  ImportAction,
  ImportState,
  initialImportState,
} from '../types/import-state';

/**
 * Reducer function for import state machine.
 */
function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'SUBMIT_URL':
      return { status: 'loading' };

    case 'PARSE_SUCCESS':
      return {
        status: 'preview',
        data: action.data,
        editedName: action.data.recipeName ?? '',
        selectedIngredients: [...action.data.ingredients],
      };

    case 'PARSE_ERROR':
      return { status: 'error', error: action.error };

    case 'EDIT_NAME':
      if (state.status !== 'preview') return state;
      return {
        ...state,
        editedName: action.name,
      };

    case 'REMOVE_INGREDIENT':
      if (state.status !== 'preview') return state;
      return {
        ...state,
        selectedIngredients: state.selectedIngredients.filter(
          (_, i) => i !== action.index
        ),
      };

    case 'CONFIRM_IMPORT':
      if (state.status !== 'preview') return state;
      return { status: 'saving' };

    case 'SAVE_SUCCESS':
      return { status: 'success', recipeId: action.recipeId };

    case 'SAVE_ERROR':
      // On save error, go back to preview state if we have the data
      // For now, just go to idle state - the sheet can handle showing an error
      return initialImportState;

    case 'RESET':
      return initialImportState;

    case 'GO_BACK':
      // From error or preview, go back to idle (URL input)
      if (state.status === 'error' || state.status === 'preview') {
        return initialImportState;
      }
      return state;

    default:
      return state;
  }
}

/**
 * Hook to manage the recipe import state machine.
 * Provides state and helper methods for state transitions.
 */
export const useImportRecipeState = () => {
  const [state, dispatch] = useReducer(importReducer, initialImportState);

  const submitUrl = useCallback((url: string) => {
    dispatch({ type: 'SUBMIT_URL', url });
  }, []);

  const parseSuccess = useCallback((data: ParseRecipeUrlResponse) => {
    dispatch({ type: 'PARSE_SUCCESS', data });
  }, []);

  const parseError = useCallback((error: RecipeParseError) => {
    dispatch({ type: 'PARSE_ERROR', error });
  }, []);

  const editName = useCallback((name: string) => {
    dispatch({ type: 'EDIT_NAME', name });
  }, []);

  const removeIngredient = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_INGREDIENT', index });
  }, []);

  const confirmImport = useCallback(() => {
    dispatch({ type: 'CONFIRM_IMPORT' });
  }, []);

  const saveSuccess = useCallback((recipeId: string) => {
    dispatch({ type: 'SAVE_SUCCESS', recipeId });
  }, []);

  const saveError = useCallback((error: Error) => {
    dispatch({ type: 'SAVE_ERROR', error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  return {
    state,
    dispatch,
    // Helper methods
    submitUrl,
    parseSuccess,
    parseError,
    editName,
    removeIngredient,
    confirmImport,
    saveSuccess,
    saveError,
    reset,
    goBack,
  };
};

export type UseImportRecipeStateReturn = ReturnType<typeof useImportRecipeState>;
