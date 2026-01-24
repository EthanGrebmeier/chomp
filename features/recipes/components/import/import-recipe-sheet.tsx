import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { AlertCircleIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

import { RecipeParseError } from '../../api/parse-recipe-url';
import { ParseRecipeUrlErrorCode } from '../../api/types';
import { getImportErrorMessage } from '../../constants/import-errors';
import { useCreateRecipe } from '../../hooks/useCreateRecipe';
import { useImportRecipeState } from '../../hooks/useImportRecipeState';
import { useParseRecipeUrl } from '../../hooks/useParseRecipeUrl';
import { transformParsedRecipe } from '../../utils/transform-parsed-recipe';
import { validateRecipeUrl } from '../../utils/validate-recipe-url';

import { IngredientListPreview } from './ingredient-list-preview';
import { ParsedRecipePreview } from './parsed-recipe-preview';
import { UrlInput, UrlInputRef } from './url-input';

export type ImportRecipeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type ImportRecipeSheetProps = {
  onImportSuccess?: (recipeId: string) => void;
};

export const ImportRecipeSheet = forwardRef<
  ImportRecipeSheetRef,
  ImportRecipeSheetProps
>(({ onImportSuccess }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const urlInputRef = useRef<UrlInputRef>(null);
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const {
    state,
    parseSuccess,
    parseError,
    editName,
    removeIngredient,
    confirmImport,
    saveSuccess,
    reset,
    goBack,
  } = useImportRecipeState();

  const parseRecipe = useParseRecipeUrl();
  const { mutate: createRecipe } = useCreateRecipe();

  useImperativeHandle(ref, () => ({
    present: () => {
      reset();
      setUrl('');
      setValidationError(undefined);
      sheetRef.current?.present();
      // Focus input after a slight delay to ensure sheet is visible
      setTimeout(() => urlInputRef.current?.focus(), 100);
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleClose = useCallback(() => {
    KeyboardController.dismiss();
    reset();
    setUrl('');
    setValidationError(undefined);
  }, [reset]);

  const handleSubmitUrl = useCallback(() => {
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }
    setValidationError(undefined);

    // Call API
    parseRecipe.mutate(
      { url: validation.url },
      {
        onSuccess: (data) => {
          parseSuccess(data);
        },
        onError: (error) => {
          if (error instanceof RecipeParseError) {
            parseError(error);
          } else {
            parseError(
              new RecipeParseError('server_error', 'An unexpected error occurred')
            );
          }
        },
      }
    );
  }, [url, parseRecipe, parseSuccess, parseError]);

  const handleConfirmImport = useCallback(() => {
    if (state.status !== 'preview') return;

    confirmImport();

    const createRecipeArgs = transformParsedRecipe(
      state.data,
      state.editedName,
      state.selectedIngredients
    );

    createRecipe(createRecipeArgs, {
      onSuccess: (result) => {
        saveSuccess(result.id);
        toast.success('Recipe imported successfully');
        onImportSuccess?.(result.id);
        sheetRef.current?.dismiss();
      },
      onError: (error) => {
        console.error('Failed to create recipe:', error);
        toast.error('Failed to import recipe');
        // Go back to preview state so user can retry
        goBack();
      },
    });
  }, [state, confirmImport, createRecipe, saveSuccess, onImportSuccess, goBack]);

  const handleRetry = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleGoBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <>
            <BottomSheet.Header title="Import Recipe" />
            <BottomSheet.Subtext className="mb-4">
              Paste a recipe URL to import ingredients
            </BottomSheet.Subtext>
            <UrlInput
              ref={urlInputRef}
              value={url}
              onChangeText={setUrl}
              onSubmit={handleSubmitUrl}
              error={validationError}
            />
            <View className="mt-4">
              <Button onPress={handleSubmitUrl} disabled={!url.trim()}>
                <Text>Import Recipe</Text>
              </Button>
            </View>
          </>
        );

      case 'loading':
        return (
          <>
            <BottomSheet.Header title="Importing Recipe" />
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.primary} />
              <Text className="mt-4 text-base text-muted-foreground">
                Parsing recipe...
              </Text>
            </View>
          </>
        );

      case 'error':
        const errorCode = state.error.code as ParseRecipeUrlErrorCode;
        const errorMessage = getImportErrorMessage(errorCode);
        const isRetryable = ['fetch_timeout', 'server_error', 'rate_limited'].includes(
          errorCode
        );

        return (
          <>
            <BottomSheet.Header
              title="Import Failed"
              dismissButton={
                <Button variant="ghost" size="icon" onPress={handleGoBack}>
                  <ArrowLeftIcon size={20} color={theme.foreground} />
                </Button>
              }
            />
            <View className="items-center justify-center py-8">
              <AlertCircleIcon size={48} color={theme.destructive} />
              <Text className="mt-4 text-center text-base text-foreground">
                {errorMessage}
              </Text>
            </View>
            <View className="mt-4 gap-2">
              {isRetryable ? (
                <Button onPress={handleSubmitUrl}>
                  <Text>Try Again</Text>
                </Button>
              ) : (
                <Button onPress={handleRetry}>
                  <Text>Edit URL</Text>
                </Button>
              )}
              <Button variant="outline" onPress={() => sheetRef.current?.dismiss()}>
                <Text>Cancel</Text>
              </Button>
            </View>
          </>
        );

      case 'preview':
        return (
          <>
            <BottomSheet.Header
              title="Review Recipe"
              dismissButton={
                <Button variant="ghost" size="icon" onPress={handleGoBack}>
                  <ArrowLeftIcon size={20} color={theme.foreground} />
                </Button>
              }
            />
            <ScrollView
              className="-mx-4 max-h-96 px-4"
              showsVerticalScrollIndicator={false}
            >
              <ParsedRecipePreview
                recipeName={state.editedName}
                onNameChange={editName}
                servings={state.data.servings}
                sourceUrl={state.data.sourceUrl}
                ingredientCount={state.selectedIngredients.length}
              />
              <View className="mt-4">
                <IngredientListPreview
                  ingredients={state.selectedIngredients}
                  onRemove={removeIngredient}
                />
              </View>
            </ScrollView>
            <View className="mt-4">
              <Button
                onPress={handleConfirmImport}
                disabled={state.selectedIngredients.length === 0}
              >
                <Text>
                  Import {state.selectedIngredients.length} Ingredient
                  {state.selectedIngredients.length !== 1 ? 's' : ''}
                </Text>
              </Button>
            </View>
          </>
        );

      case 'saving':
        return (
          <>
            <BottomSheet.Header title="Creating Recipe" />
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.primary} />
              <Text className="mt-4 text-base text-muted-foreground">
                Saving recipe...
              </Text>
            </View>
          </>
        );

      case 'success':
        return (
          <>
            <BottomSheet.Header title="Success" />
            <View className="items-center justify-center py-8">
              <CheckCircleIcon size={48} color={theme.primary} />
              <Text className="mt-4 text-center text-base text-foreground">
                Recipe imported successfully!
              </Text>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <BottomSheet
      name="import-recipe-sheet"
      ref={sheetRef}
      onStartClose={handleClose}
      scrollable={state.status === 'preview'}
    >
      <BottomSheet.SheetView className="gap-4">{renderContent()}</BottomSheet.SheetView>
    </BottomSheet>
  );
});

ImportRecipeSheet.displayName = 'ImportRecipeSheet';
