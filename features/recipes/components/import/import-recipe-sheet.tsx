import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from 'lucide-react-native';
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
import { checkNetworkStatus } from '@/hooks/use-network-status';
import { THEME } from '@/lib/theme';

import { BackButton } from '../../../../components/ui/back-button';
import { RecipeParseError } from '../../api/parse-recipe-url';
import { ParsedIngredient } from '../../api/types';
import { useCreateRecipe } from '../../hooks/useCreateRecipe';
import { useImportRecipeState } from '../../hooks/useImportRecipeState';
import { useParseRecipeUrl } from '../../hooks/useParseRecipeUrl';
import { transformParsedRecipe } from '../../utils/transform-parsed-recipe';
import { validateRecipeUrl } from '../../utils/validate-recipe-url';

import {
  EditParsedIngredientSheet,
  EditParsedIngredientSheetRef,
} from './edit-parsed-ingredient-sheet';
import { ImportError } from './import-error';
import { IngredientListPreview } from './ingredient-list-preview';
import { ParsedRecipePreview } from './parsed-recipe-preview';
import { UrlInput, UrlInputRef } from './url-input';

/** Maximum character length for recipe names */
const MAX_RECIPE_NAME_LENGTH = 100;

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
  const editSheetRef = useRef<EditParsedIngredientSheetRef>(null);
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  // Track if sheet is open to ignore responses after dismissal
  const isSheetOpenRef = useRef(false);
  // Track if confirm action is in progress to prevent double-tap
  const isConfirmingRef = useRef(false);
  // Track if edit sheet is open to prevent multiple opens
  const isEditingRef = useRef(false);

  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const {
    state,
    submitUrl,
    parseSuccess,
    parseError,
    editName,
    removeIngredient,
    updateIngredient,
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
      isSheetOpenRef.current = true;
      isConfirmingRef.current = false;
      sheetRef.current?.present();
      // Focus input after a slight delay to ensure sheet is visible
      setTimeout(() => urlInputRef.current?.focus(), 100);
    },
    dismiss: () => {
      isSheetOpenRef.current = false;
      sheetRef.current?.dismiss();
    },
  }));

  const handleClose = useCallback(() => {
    KeyboardController.dismiss();
    isSheetOpenRef.current = false;
    isConfirmingRef.current = false;
    isEditingRef.current = false;
    // Dismiss edit sheet if open
    editSheetRef.current?.dismiss();
    reset();
    setUrl('');
    setValidationError(undefined);
  }, [reset]);

  const handleSubmitUrl = useCallback(async () => {
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }
    setValidationError(undefined);

    // Check network connectivity before making API call
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

    // Transition to loading state first
    submitUrl(validation.url);

    // Call API
    parseRecipe.mutate(
      { url: validation.url },
      {
        onSuccess: data => {
          // Ignore response if sheet was dismissed during loading
          if (!isSheetOpenRef.current) return;
          parseSuccess(data);
        },
        onError: error => {
          // Ignore error if sheet was dismissed during loading
          if (!isSheetOpenRef.current) return;

          if (error instanceof RecipeParseError) {
            parseError(error);
          } else {
            parseError(
              new RecipeParseError(
                'server_error',
                'An unexpected error occurred'
              )
            );
          }
        },
      }
    );
  }, [url, submitUrl, parseRecipe, parseSuccess, parseError]);

  const handleConfirmImport = useCallback(async () => {
    if (state.status !== 'preview') return;

    // Double-tap prevention: ignore if already confirming
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;

    // Check network connectivity before saving
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      isConfirmingRef.current = false;
      toast.error(
        'No internet connection. Please check your connection and try again.'
      );
      return;
    }

    confirmImport();

    const createRecipeArgs = transformParsedRecipe(
      state.data,
      state.editedName,
      state.selectedIngredients
    );

    createRecipe(createRecipeArgs, {
      onSuccess: result => {
        isConfirmingRef.current = false;
        // Ignore if sheet was dismissed
        if (!isSheetOpenRef.current) return;

        saveSuccess(result.id);
        toast.success('Recipe imported successfully');
        onImportSuccess?.(result.id);
        sheetRef.current?.dismiss();
      },
      onError: error => {
        isConfirmingRef.current = false;
        // Ignore if sheet was dismissed
        if (!isSheetOpenRef.current) return;

        console.error('Failed to create recipe:', error);
        toast.error('Failed to import recipe');
        // Go back to preview state so user can retry
        goBack();
      },
    });
  }, [
    state,
    confirmImport,
    createRecipe,
    saveSuccess,
    onImportSuccess,
    goBack,
  ]);

  const handleRetry = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleGoBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleEditIngredient = useCallback(
    (index: number, ingredient: ParsedIngredient) => {
      // Prevent multiple edit sheets from opening
      if (isEditingRef.current) return;
      isEditingRef.current = true;
      editSheetRef.current?.present(index, ingredient);
    },
    []
  );

  const handleSaveIngredient = useCallback(
    (index: number, ingredient: ParsedIngredient) => {
      updateIngredient(index, ingredient);
      isEditingRef.current = false;
    },
    [updateIngredient]
  );

  const handleEditCancel = useCallback(() => {
    isEditingRef.current = false;
  }, []);

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <>
            <BottomSheet.Header className="mb-2" title="Import Recipe" />
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
                Retrieving recipe...
              </Text>
            </View>
          </>
        );

      case 'error':
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
            <ImportError
              error={state.error}
              onRetry={handleSubmitUrl}
              onEditUrl={handleRetry}
              onCancel={() => sheetRef.current?.dismiss()}
            />
          </>
        );

      case 'preview': {
        const originalHadIngredients = state.data.ingredients.length > 0;
        const hasNoIngredients = state.selectedIngredients.length === 0;

        // Handle name change with length limit enforcement
        const handleNameChange = (name: string) => {
          // Allow typing but truncate to max length
          const truncatedName = name.slice(0, MAX_RECIPE_NAME_LENGTH);
          editName(truncatedName);
        };

        return (
          <>
            <BottomSheet.Header
              title="Review Recipe"
              dismissButton={<BackButton onPress={handleGoBack} />}
            />
            <ScrollView
              className="-mx-4 flex-1 px-4"
              contentContainerClassName="pb-16"
              showsVerticalScrollIndicator={false}
            >
              <ParsedRecipePreview
                recipeName={state.editedName}
                onNameChange={handleNameChange}
                maxNameLength={MAX_RECIPE_NAME_LENGTH}
              />

              {/* Empty ingredients warning - only shown when API returned no ingredients */}
              {hasNoIngredients && !originalHadIngredients && (
                <View className="mt-4 flex-row items-center gap-3 rounded-lg bg-amber-500/10 p-3">
                  <AlertTriangleIcon size={20} color="#f59e0b" />
                  <Text className="flex-1 text-sm text-amber-700 dark:text-amber-400">
                    No ingredients were found on this page. You can still import
                    the recipe and add ingredients manually.
                  </Text>
                </View>
              )}

              {/* Warning when user removed all ingredients */}
              {hasNoIngredients && originalHadIngredients && (
                <View className="mt-4 flex-row items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <AlertTriangleIcon size={20} color={theme.mutedForeground} />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    All ingredients have been removed. You can still import the
                    recipe without ingredients.
                  </Text>
                </View>
              )}

              {state.selectedIngredients.length > 0 && (
                <View className="mt-4">
                  <IngredientListPreview
                    ingredients={state.selectedIngredients}
                    onRemove={removeIngredient}
                    onEdit={handleEditIngredient}
                  />
                </View>
              )}
            </ScrollView>
          </>
        );
      }

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

  const isPreview = state.status === 'preview';

  const renderFooter = () => {
    if (state.status !== 'preview') return undefined;

    const isNameTooLong = state.editedName.length > MAX_RECIPE_NAME_LENGTH;
    const hasNoIngredients = state.selectedIngredients.length === 0;

    return (
      <View className="px-8 pb-4">
        <Button
          onPress={handleConfirmImport}
          disabled={isNameTooLong || !state.editedName.trim()}
        >
          <Text>
            {hasNoIngredients
              ? 'Import Recipe'
              : `Import ${state.selectedIngredients.length} Ingredient${state.selectedIngredients.length !== 1 ? 's' : ''}`}
          </Text>
        </Button>
        {!state.editedName.trim() && (
          <Text className="mt-2 text-center text-sm text-destructive">
            Please enter a recipe name
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <BottomSheet
        name="import-recipe-sheet"
        ref={sheetRef}
        onStartClose={handleClose}
        scrollable={isPreview}
        detents={isPreview ? [0.9] : ['auto']}
        viewClassName={isPreview ? 'flex-1' : undefined}
        footer={renderFooter()}
      >
        <BottomSheet.SheetView className="gap-4">
          {renderContent()}
        </BottomSheet.SheetView>
      </BottomSheet>
      <EditParsedIngredientSheet
        ref={editSheetRef}
        onSave={handleSaveIngredient}
        onCancel={handleEditCancel}
      />
    </>
  );
});

ImportRecipeSheet.displayName = 'ImportRecipeSheet';
