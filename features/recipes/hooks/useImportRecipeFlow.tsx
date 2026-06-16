import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner-native';

import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { checkNetworkStatus } from '@/hooks/use-network-status';

import { RecipeParseError } from '../api/parse-recipe-url';
import { ParsedIngredient } from '../api/types';
import { transformParsedRecipe } from '../utils/transform-parsed-recipe';
import { validateRecipeUrl } from '../utils/validate-recipe-url';

import { useCreateRecipe } from './useCreateRecipe';
import { useImportRecipeState } from './useImportRecipeState';
import { useParseRecipeUrl } from './useParseRecipeUrl';

export const MAX_RECIPE_NAME_LENGTH = 100;

type UseImportRecipeFlowProps = {
  onImportSuccess?: (recipeId: string) => void;
};

export const useImportRecipeFlow = ({
  onImportSuccess,
}: UseImportRecipeFlowProps = {}) => {
  const isMountedRef = useRef(true);
  const isConfirmingRef = useRef(false);
  const urlInput = useUncontrolledTextInput();
  const [urlHasValue, setUrlHasValue] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const {
    state,
    submitUrl,
    parseSuccess,
    parseError,
    editName,
    toggleIngredientSelection,
    toggleAllIngredients,
    updateIngredient,
    confirmImport,
    saveSuccess,
    reset,
    goBack,
  } = useImportRecipeState();
  const parseRecipe = useParseRecipeUrl();
  const { mutate: createRecipe } = useCreateRecipe();

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleReset = useCallback(() => {
    reset();
    urlInput.reset();
    setUrlHasValue(false);
    setValidationError(undefined);
    isConfirmingRef.current = false;
  }, [reset, urlInput]);

  const handleUrlChange = useCallback(
    (text: string) => {
      urlInput.handleChangeText(text);
      setUrlHasValue(text.trim().length > 0);
      if (validationError) {
        setValidationError(undefined);
      }
    },
    [urlInput, validationError]
  );

  const handleSubmitUrl = useCallback(async () => {
    const url = urlInput.getValue();
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }
    setValidationError(undefined);

    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      parseError(
        new RecipeParseError(
          'fetch_timeout',
          'No internet connection. Please check your connection and try again.'
        )
      );
      return;
    }

    submitUrl(validation.url);

    parseRecipe.mutate(
      { url: validation.url },
      {
        onSuccess: data => {
          if (!isMountedRef.current) return;
          parseSuccess(data);
        },
        onError: error => {
          if (!isMountedRef.current) return;

          if (error instanceof RecipeParseError) {
            parseError(error);
            return;
          }

          parseError(
            new RecipeParseError('server_error', 'An unexpected error occurred')
          );
        },
      }
    );
  }, [parseError, parseRecipe, parseSuccess, submitUrl, urlInput]);

  const handleConfirmImport = useCallback(async () => {
    if (state.status !== 'preview') return;
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;

    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      isConfirmingRef.current = false;
      toast.error(
        'No internet connection. Please check your connection and try again.'
      );
      return;
    }

    confirmImport();

    const selectedIngredients = state.ingredients.filter((_, index) =>
      state.selectedIndices.has(index)
    );

    createRecipe(
      transformParsedRecipe(state.data, state.editedName, selectedIngredients),
      {
        onSuccess: result => {
          isConfirmingRef.current = false;
          if (!isMountedRef.current) return;

          saveSuccess(result.id);
          onImportSuccess?.(result.id);
        },
        onError: error => {
          isConfirmingRef.current = false;
          if (!isMountedRef.current) return;

          console.error('Failed to create recipe:', error);
          toast.error('Failed to import recipe');
          goBack();
        },
      }
    );
  }, [confirmImport, createRecipe, goBack, onImportSuccess, saveSuccess, state]);

  const handleRetry = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSaveIngredient = useCallback(
    (index: number, ingredient: ParsedIngredient) => {
      updateIngredient(index, ingredient);
    },
    [updateIngredient]
  );

  return {
    state,
    urlInput,
    urlHasValue,
    validationError,
    handleUrlChange,
    handleSubmitUrl,
    handleConfirmImport,
    handleRetry,
    handleGoBack: goBack,
    handleReset,
    editName,
    toggleIngredientSelection,
    toggleAllIngredients,
    handleSaveIngredient,
  };
};

export type UseImportRecipeFlowReturn = ReturnType<typeof useImportRecipeFlow>;
