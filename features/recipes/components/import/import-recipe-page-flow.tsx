import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getImportErrorPresentation } from '@/features/recipes/constants/import-errors';
import { useClipboardUrlHint } from '@/features/recipes/hooks/useClipboardUrlHint';
import {
  MAX_RECIPE_NAME_LENGTH,
  UseImportRecipeFlowReturn,
} from '@/features/recipes/hooks/useImportRecipeFlow';
import { navigation } from '@/lib/navigation';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

import { ClipboardUrlChip } from './clipboard-url-chip';
import { ImportError } from './import-error';
import { ImportLoading } from './import-loading';
import { IngredientSummary } from './ingredient-summary';

type ImportRecipePageFlowProps = {
  flow: UseImportRecipeFlowReturn;
  onCancel: () => void;
};

const firstParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

const UrlStep = ({ flow }: { flow: UseImportRecipeFlowReturn }) => {
  const { mayHaveUrl, readUrl } = useClipboardUrlHint(!flow.urlHasValue);
  const [clipboardError, setClipboardError] = useState<string | undefined>();

  const handlePaste = useCallback(async () => {
    const url = await readUrl();
    if (url) {
      setClipboardError(undefined);
      flow.handleSubmitPastedUrl(url);
    } else {
      setClipboardError("We couldn't find a link on your clipboard.");
    }
  }, [flow, readUrl]);

  const error = flow.validationError ?? clipboardError;

  return (
    // Shrinks by the keyboard height so the content re-centres in whatever
    // space is left, rather than being covered. The ScrollView is a safety
    // net for small screens where the block no longer fits when the
    // keyboard is up; `flex-grow` (not `flex-1`) lets it overflow and scroll.
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center gap-6 px-8 py-10"
      >
        <View className="gap-2">
          <Text className="text-left text-sm font-medium text-muted-foreground">
            Recipe URL
          </Text>
          <TextInput
            key={flow.urlInput.inputKey}
            defaultValue={flow.urlInput.defaultValue}
            onChangeText={text => {
              setClipboardError(undefined);
              flow.handleUrlChange(text);
            }}
            onSubmitEditing={flow.handleSubmitUrl}
            placeholder="https://example.com/recipe"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            selectTextOnFocus
            autoFocus
            className={cn('rounded-xl', error && 'border border-destructive')}
          />
          {error ? (
            <Text className="text-sm text-destructive">{error}</Text>
          ) : null}
        </View>

        {mayHaveUrl && !flow.urlHasValue ? (
          <ClipboardUrlChip onPress={handlePaste} />
        ) : null}

        <Button
          size="xl"
          onPress={flow.handleSubmitUrl}
          disabled={!flow.urlHasValue}
        >
          <Text>Import Recipe</Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const PreviewStep = ({ flow }: { flow: UseImportRecipeFlowReturn }) => {
  const params = useLocalSearchParams<{ listId?: string | string[] }>();
  const listId = firstParam(params.listId);
  const bottomInset = useSafeAreaInsets().bottom;

  if (flow.state.status !== 'preview') return null;
  const { state } = flow;

  const originalHadIngredients = state.data.ingredients.length > 0;
  const hasIngredients = state.ingredients.length > 0;
  const isNameTooLong = state.editedName.length > MAX_RECIPE_NAME_LENGTH;
  const selectedCount = state.selectedIndices.size;
  const showNameCount = state.editedName.length >= MAX_RECIPE_NAME_LENGTH - 20;

  const openIngredientEditor = () => {
    router.push(navigation.goToCreateRecipeImportIngredients(listId));
  };

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-4 pb-6"
        bottomOffset={72}
      >
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-muted-foreground">
              Recipe Name
            </Text>
            {showNameCount ? (
              <Text
                variant="caption"
                tabularNumbers
                className={cn(
                  'text-xs leading-4',
                  isNameTooLong && 'text-destructive',
                  state.editedName.length >= MAX_RECIPE_NAME_LENGTH - 10 &&
                    !isNameTooLong &&
                    'text-amber-600 dark:text-amber-400'
                )}
              >
                {state.editedName.length}/{MAX_RECIPE_NAME_LENGTH}
              </Text>
            ) : null}
          </View>
          <TextInput
            value={state.editedName}
            onChangeText={flow.editName}
            placeholder="Enter recipe name"
            autoCapitalize="words"
            maxLength={MAX_RECIPE_NAME_LENGTH}
            className="rounded-xl"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Source URL
          </Text>
          <TextInput
            value={state.editedSourceUrl}
            onChangeText={flow.editSourceUrl}
            placeholder="https://example.com/recipe"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            className="rounded-xl"
            accessibilityLabel="Recipe source URL"
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

        {hasIngredients ? (
          <IngredientSummary
            ingredients={state.ingredients}
            selectedIndices={state.selectedIndices}
            onEdit={openIngredientEditor}
          />
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: bottomInset - 12 }}>
        <View
          className="bg-background px-4 pt-3"
          style={{ paddingBottom: Math.max(bottomInset, 12) }}
        >
          <Button
            size="xl"
            onPress={flow.handleConfirmImport}
            disabled={isNameTooLong || !state.editedName.trim()}
          >
            <Text>
              {selectedCount === 0
                ? 'Import Recipe'
                : `Import ${selectedCount} Ingredient${selectedCount !== 1 ? 's' : ''}`}
            </Text>
          </Button>
        </View>
      </KeyboardStickyView>
    </View>
  );
};

export const ImportRecipePageFlow = ({
  flow,
  onCancel,
}: ImportRecipePageFlowProps) => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  switch (flow.state.status) {
    case 'idle':
      return <UrlStep flow={flow} />;

    case 'loading':
      return (
        <ImportLoading
          url={flow.state.url}
          onCancel={flow.handleCancelImport}
        />
      );

    case 'error': {
      const { retryable } = getImportErrorPresentation(flow.state.error.code);
      return (
        <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
          <ImportError error={flow.state.error} />
          <View className="gap-2">
            {retryable ? (
              <Button size="xl" onPress={flow.handleSubmitUrl}>
                <Text>Try Again</Text>
              </Button>
            ) : null}
            <Button
              size="xl"
              variant={retryable ? 'outline' : 'default'}
              onPress={flow.handleRetry}
            >
              <Text>Edit URL</Text>
            </Button>
            <Button size="xl" variant="ghost" onPress={onCancel}>
              <Text>Cancel</Text>
            </Button>
          </View>
        </ScrollView>
      );
    }

    case 'preview':
      return <PreviewStep flow={flow} />;

    case 'saving':
      return (
        <View className="items-center justify-center py-16">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="mt-4 text-base text-muted-foreground">
            Saving recipe…
          </Text>
        </View>
      );

    case 'success':
      return (
        <View className="items-center justify-center py-12">
          <CheckCircleIcon size={48} color={theme.primary} />
          <Text className="mt-4 text-center text-base text-foreground">
            Recipe imported successfully!
          </Text>
        </View>
      );

    default:
      return null;
  }
};
