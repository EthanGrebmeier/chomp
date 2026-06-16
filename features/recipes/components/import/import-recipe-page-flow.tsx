import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ParseRecipeUrlErrorCode } from '@/features/recipes/api/types';
import {
  MAX_RECIPE_NAME_LENGTH,
  UseImportRecipeFlowReturn,
} from '@/features/recipes/hooks/useImportRecipeFlow';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

import {
  EditParsedIngredientSheet,
  EditParsedIngredientSheetRef,
} from './edit-parsed-ingredient-sheet';
import { ImportError, RETRYABLE_ERROR_CODES } from './import-error';
import {
  IngredientListHeader,
  IngredientListPreview,
} from './ingredient-list-preview';

type ImportRecipePageFlowProps = {
  flow: UseImportRecipeFlowReturn;
  onCancel: () => void;
};

export const ImportRecipePageFlow = ({
  flow,
  onCancel,
}: ImportRecipePageFlowProps) => {
  const editSheetRef = useRef<EditParsedIngredientSheetRef>(null);
  const urlTextInputRef = useRef<RNTextInput>(null);
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const handleClearUrl = useCallback(() => {
    flow.handleUrlChange('');
    urlTextInputRef.current?.setNativeProps({ text: '' });
    urlTextInputRef.current?.focus();
  }, [flow]);

  if (flow.state.status === 'idle') {
    return (
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-center text-base text-muted-foreground">
            Paste a recipe URL to import ingredients.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Recipe URL
          </Text>
          <View className="relative">
            <TextInput
              key={flow.urlInput.inputKey}
              ref={urlTextInputRef}
              defaultValue={flow.urlInput.defaultValue}
              onChangeText={flow.handleUrlChange}
              onSubmitEditing={flow.handleSubmitUrl}
              placeholder="https://example.com/recipe"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              selectTextOnFocus
              className={cn(
                'rounded-xl pr-12',
                flow.validationError && 'border border-destructive'
              )}
            />
            {flow.urlHasValue ? (
              <View className="absolute right-2 top-0 h-11 items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={handleClearUrl}
                  className="h-8 w-8"
                >
                  <XIcon size={18} color={theme.foreground} />
                </Button>
              </View>
            ) : null}
          </View>
          {flow.validationError ? (
            <Text className="text-sm text-destructive">
              {flow.validationError}
            </Text>
          ) : null}
        </View>

        <Button
          size="xl"
          onPress={flow.handleSubmitUrl}
          disabled={!flow.urlHasValue}
        >
          <Text>Import Recipe</Text>
        </Button>
      </View>
    );
  }

  if (flow.state.status === 'loading') {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="mt-4 text-base text-muted-foreground">
          Retrieving recipe...
        </Text>
      </View>
    );
  }

  if (flow.state.status === 'error') {
    const errorCode = flow.state.error.code as ParseRecipeUrlErrorCode;
    const isRetryable = RETRYABLE_ERROR_CODES.includes(errorCode);

    return (
      <View className="gap-6">
        <ImportError error={flow.state.error} />
        <View className="gap-2">
          {isRetryable ? (
            <Button size="xl" onPress={flow.handleSubmitUrl}>
              <Text>Try Again</Text>
            </Button>
          ) : (
            <Button size="xl" onPress={flow.handleRetry}>
              <Text>Edit URL</Text>
            </Button>
          )}
          <Button size="xl" variant="outline" onPress={onCancel}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    );
  }

  if (flow.state.status === 'preview') {
    const originalHadIngredients = flow.state.data.ingredients.length > 0;
    const isNameTooLong =
      flow.state.editedName.length > MAX_RECIPE_NAME_LENGTH;
    const selectedCount = flow.state.selectedIndices.size;
    const showNameCount =
      flow.state.editedName.length >= MAX_RECIPE_NAME_LENGTH - 20;

    return (
      <>
        <View className="gap-6">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-muted-foreground">
                Recipe Name
              </Text>
              {showNameCount ? (
                <Text
                  className={cn(
                    'text-xs text-muted-foreground',
                    isNameTooLong && 'text-destructive',
                    flow.state.editedName.length >=
                      MAX_RECIPE_NAME_LENGTH - 10 &&
                      !isNameTooLong &&
                      'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {flow.state.editedName.length}/{MAX_RECIPE_NAME_LENGTH}
                </Text>
              ) : null}
            </View>
            <TextInput
              value={flow.state.editedName}
              onChangeText={flow.editName}
              placeholder="Enter recipe name"
              autoCapitalize="words"
              maxLength={MAX_RECIPE_NAME_LENGTH}
              className="rounded-xl"
            />
          </View>

          {!originalHadIngredients ? (
            <View className="flex-row items-center gap-3 rounded-lg bg-amber-500/10 p-3">
              <AlertTriangleIcon size={20} color="#f59e0b" />
              <Text className="flex-1 text-sm text-amber-700 dark:text-amber-400">
                No ingredients were found on this page. You can still import the
                recipe and add ingredients manually.
              </Text>
            </View>
          ) : null}

          {flow.state.ingredients.length > 0 ? (
            <IngredientListHeader
              selectedCount={selectedCount}
              totalCount={flow.state.ingredients.length}
              allSelected={selectedCount === flow.state.ingredients.length}
              onToggleAll={flow.toggleAllIngredients}
              isEditable
            />
          ) : null}

          <IngredientListPreview
            ingredients={flow.state.ingredients}
            selectedIndices={flow.state.selectedIndices}
            onToggleSelection={flow.toggleIngredientSelection}
            onToggleAll={flow.toggleAllIngredients}
            onEdit={(index, ingredient) =>
              editSheetRef.current?.present(index, ingredient)
            }
            showHeader={false}
          />

          <View className="gap-2">
            <Button
              size="xl"
              onPress={flow.handleConfirmImport}
              disabled={isNameTooLong || !flow.state.editedName.trim()}
            >
              <Text>
                {selectedCount === 0
                  ? 'Import Recipe'
                  : `Import ${selectedCount} Ingredient${selectedCount !== 1 ? 's' : ''}`}
              </Text>
            </Button>
            <Button size="xl" variant="outline" onPress={flow.handleGoBack}>
              <Text>Edit URL</Text>
            </Button>
          </View>
        </View>
        <EditParsedIngredientSheet
          ref={editSheetRef}
          onSave={flow.handleSaveIngredient}
        />
      </>
    );
  }

  if (flow.state.status === 'saving') {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="mt-4 text-base text-muted-foreground">
          Saving recipe...
        </Text>
      </View>
    );
  }

  if (flow.state.status === 'success') {
    return (
      <View className="items-center justify-center py-12">
        <CheckCircleIcon size={48} color={theme.primary} />
        <Text className="mt-4 text-center text-base text-foreground">
          Recipe imported successfully!
        </Text>
      </View>
    );
  }

  return null;
};
