import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  View,
} from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { checkNetworkStatus } from '@/hooks/use-network-status';
import { THEME } from '@/lib/theme';

import { BackButton } from '../../../../components/ui/back-button';
import { RecipeParseError } from '../../api/parse-recipe-url';
import { ParseRecipeUrlErrorCode, ParsedIngredient } from '../../api/types';
import { useCreateRecipe } from '../../hooks/useCreateRecipe';
import { useImportRecipeState } from '../../hooks/useImportRecipeState';
import { useParseRecipeUrl } from '../../hooks/useParseRecipeUrl';
import { transformParsedRecipe } from '../../utils/transform-parsed-recipe';
import { validateRecipeUrl } from '../../utils/validate-recipe-url';

import {
  EditParsedIngredientSheet,
  EditParsedIngredientSheetRef,
} from './edit-parsed-ingredient-sheet';
import { ImportError, RETRYABLE_ERROR_CODES } from './import-error';
import {
  IngredientListHeader,
  IngredientListPreview,
} from './ingredient-list-preview';
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
  const editRecipeNameSheetRef = useRef<TrueSheet>(null);
  const recipeNameInputRef = useRef<RNTextInput>(null);
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [draftRecipeName, setDraftRecipeName] = useState('');

  // Track if sheet is open to ignore responses after dismissal
  const isSheetOpenRef = useRef(false);
  // Track if confirm action is in progress to prevent double-tap
  const isConfirmingRef = useRef(false);
  // Track if edit sheet is open to prevent multiple opens
  const isEditingRef = useRef(false);
  // Track if recipe name edit sheet is open to prevent multiple opens
  const isEditingNameRef = useRef(false);

  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

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

  useImperativeHandle(ref, () => ({
    present: () => {
      reset();
      setUrl('');
      setValidationError(undefined);
      isSheetOpenRef.current = true;
      isConfirmingRef.current = false;
      sheetRef.current?.present();
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
    isEditingNameRef.current = false;
    // Dismiss edit sheet if open
    editSheetRef.current?.dismiss();
    editRecipeNameSheetRef.current?.dismiss();
    setDraftRecipeName('');
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
          console.log(
            'Recipe parsed successfully',
            JSON.stringify(data, null, 2)
          );
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

    // Get only the selected ingredients
    const selectedIngredients = state.ingredients.filter((_, index) =>
      state.selectedIndices.has(index)
    );

    const createRecipeArgs = transformParsedRecipe(
      state.data,
      state.editedName,
      selectedIngredients
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
        console.log(
          'Recipe imported successfully',
          JSON.stringify(result, null, 2)
        );
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

  const handleOpenEditNameSheet = useCallback(() => {
    if (isEditingNameRef.current) return;
    if (state.status !== 'preview') return;
    isEditingNameRef.current = true;
    setDraftRecipeName(state.editedName);
    editRecipeNameSheetRef.current?.present();
  }, [state]);

  const handleCloseEditNameSheet = useCallback(() => {
    Keyboard.dismiss();
    isEditingNameRef.current = false;
    setDraftRecipeName('');
  }, []);

  const handleEditNameSheetOpen = useCallback(() => {
    setTimeout(() => {
      recipeNameInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSaveRecipeName = useCallback(() => {
    const truncatedName = draftRecipeName.slice(0, MAX_RECIPE_NAME_LENGTH);
    if (!truncatedName.trim()) return;
    editName(truncatedName);
    editRecipeNameSheetRef.current?.dismiss();
  }, [draftRecipeName, editName]);

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <>
            <BottomSheet.Header
              subsection={
                <BottomSheet.Subtext>
                  Paste a recipe URL to import ingredients
                </BottomSheet.Subtext>
              }
              className="mb-0"
              title="Import Recipe"
            />
            <UrlInput
              className="pb-20"
              ref={urlInputRef}
              value={url}
              onChangeText={setUrl}
              onSubmit={handleSubmitUrl}
              error={validationError}
            />
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
              dismissButton={<BackButton onPress={handleGoBack} />}
            />
            <ImportError error={state.error} />
          </>
        );

      case 'preview': {
        const originalHadIngredients = state.data.ingredients.length > 0;

        return (
          <View className="">
            <BottomSheet.Header
              title="Review Recipe"
              className="mb-0 px-4"
              dismissButton={<BackButton onPress={handleGoBack} />}
            />
            <View className="gap-4 px-4">
              <View className="gap-2">
                <Pressable
                  onPress={handleOpenEditNameSheet}
                  className="flex-row items-center justify-between"
                >
                  <Text
                    className="mr-3 flex-1 text-2xl font-bold text-foreground"
                    numberOfLines={2}
                  >
                    {state.editedName || 'Enter recipe name'}
                  </Text>
                  <PencilIcon size={16} color={theme.mutedForeground} />
                </Pressable>
              </View>

              {/* Empty ingredients warning - only shown when API returned no ingredients */}
              {!originalHadIngredients && (
                <View className="flex-row items-center gap-3 rounded-lg bg-amber-500/10 p-3">
                  <AlertTriangleIcon size={20} color="#f59e0b" />
                  <Text className="flex-1 text-sm text-amber-700 dark:text-amber-400">
                    No ingredients were found on this page. You can still import
                    the recipe and add ingredients manually.
                  </Text>
                </View>
              )}

              {state.ingredients.length > 0 && (
                <IngredientListHeader
                  selectedCount={state.selectedIndices.size}
                  totalCount={state.ingredients.length}
                  allSelected={
                    state.selectedIndices.size === state.ingredients.length
                  }
                  onToggleAll={toggleAllIngredients}
                  isEditable
                />
              )}
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              className="max-h-[400px] min-h-24 "
              contentContainerClassName="pb-8"
            >
              <IngredientListPreview
                ingredients={state.ingredients}
                selectedIndices={state.selectedIndices}
                onToggleSelection={toggleIngredientSelection}
                onToggleAll={toggleAllIngredients}
                onEdit={handleEditIngredient}
                showHeader={false}
              />
            </ScrollView>
          </View>
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
    if (state.status === 'idle') {
      return (
        <View className="px-10 pb-4">
          <Button onPress={handleSubmitUrl} disabled={!url.trim()}>
            <Text>Import Recipe</Text>
          </Button>
        </View>
      );
    }

    if (state.status === 'error') {
      const errorCode = state.error.code as ParseRecipeUrlErrorCode;
      const isRetryable = RETRYABLE_ERROR_CODES.includes(errorCode);

      return (
        <View className="gap-2 px-10 pb-4">
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
      );
    }

    if (state.status !== 'preview') return undefined;

    const isNameTooLong = state.editedName.length > MAX_RECIPE_NAME_LENGTH;
    const selectedCount = state.selectedIndices.size;

    return (
      <View className="bg-card px-10 py-4">
        <Button
          onPress={handleConfirmImport}
          disabled={isNameTooLong || !state.editedName.trim()}
        >
          <Text>
            {selectedCount === 0
              ? 'Import Recipe'
              : `Import ${selectedCount} Ingredient${selectedCount !== 1 ? 's' : ''}`}
          </Text>
        </Button>
      </View>
    );
  };

  const content = renderContent();
  const isDraftNameTooLong = draftRecipeName.length > MAX_RECIPE_NAME_LENGTH;
  const showDraftCharCount =
    draftRecipeName.length >= MAX_RECIPE_NAME_LENGTH - 20;

  return (
    <>
      <BottomSheet
        name="import-recipe-sheet"
        ref={sheetRef}
        onStartClose={handleClose}
        scrollable={false}
        detents={['auto']}
        footer={renderFooter()}
        viewClassName="gap-4"
      >
        {isPreview ? (
          content
        ) : (
          <BottomSheet.SheetView className="gap-4">
            {content}
          </BottomSheet.SheetView>
        )}
      </BottomSheet>
      <EditParsedIngredientSheet
        ref={editSheetRef}
        onSave={handleSaveIngredient}
        onCancel={handleEditCancel}
      />
      <BottomSheet
        name="edit-recipe-name-sheet"
        ref={editRecipeNameSheetRef}
        onStartClose={handleCloseEditNameSheet}
        onOpen={handleEditNameSheetOpen}
        detents={['auto']}
        footer={
          <View className="gap-2 px-10 pb-4">
            <Button
              onPress={handleSaveRecipeName}
              disabled={isDraftNameTooLong || !draftRecipeName.trim()}
            >
              <Text>Save Name</Text>
            </Button>
            <Button
              variant="outline"
              onPress={() => editRecipeNameSheetRef.current?.dismiss()}
            >
              <Text>Cancel</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="gap-4 pb-24">
          <BottomSheet.Header title="Edit Recipe Name" />
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-muted-foreground">
                Recipe Name
              </Text>
              {showDraftCharCount && (
                <Text
                  className={`text-xs ${
                    isDraftNameTooLong
                      ? 'text-destructive'
                      : draftRecipeName.length >= MAX_RECIPE_NAME_LENGTH - 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {draftRecipeName.length}/{MAX_RECIPE_NAME_LENGTH}
                </Text>
              )}
            </View>
            <BottomSheet.TextInput
              ref={recipeNameInputRef}
              value={draftRecipeName}
              onChangeText={setDraftRecipeName}
              placeholder="Enter recipe name"
              autoCapitalize="words"
              selectTextOnFocus
              maxLength={MAX_RECIPE_NAME_LENGTH}
              returnKeyType="done"
              onSubmitEditing={handleSaveRecipeName}
            />
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
});

ImportRecipeSheet.displayName = 'ImportRecipeSheet';
