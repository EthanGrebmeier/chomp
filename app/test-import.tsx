import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { CategoryTag } from '@/components/category-tag';
import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getImportErrorMessage } from '@/features/recipes/constants/import-errors';
import { useParseRecipeUrl } from '@/features/recipes/hooks/useParseRecipeUrl';
import { validateRecipeUrl } from '@/features/recipes/utils/validate-recipe-url';

export default function TestImport() {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, data, error, isPending, reset } = useParseRecipeUrl();

  const handleSubmit = () => {
    setValidationError(null);
    const validation = validateRecipeUrl(url);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }
    mutate({ url: validation.url });
  };

  const handleReset = () => {
    setUrl('');
    setValidationError(null);
    reset();
  };

  const formatQuantity = (quantity: number | null, unit: string | null) => {
    if (quantity === null) return '';
    const unitStr = unit ? ` ${unit}` : '';
    return `${quantity}${unitStr}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pt-safe pb-safe"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-4">
          <Text variant="h3" className="mb-6">
            Test Recipe Import
          </Text>

          {/* URL Input */}
          <View className="mb-4">
            <Text className="mb-2 font-medium">Recipe URL</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/recipe"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isPending}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />
            {validationError && (
              <Text className="mt-2 text-sm text-destructive">
                {validationError}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-6 flex-row gap-3">
            <Button
              onPress={handleSubmit}
              disabled={isPending || !url.trim()}
              className="flex-1"
            >
              {isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text>Parse Recipe</Text>
              )}
            </Button>
            <Button variant="outline" onPress={handleReset} disabled={isPending}>
              <Text>Reset</Text>
            </Button>
          </View>

          {/* Loading State */}
          {isPending && (
            <View className="items-center rounded-xl bg-card p-6">
              <ActivityIndicator size="large" className="mb-3" />
              <Text className="text-muted-foreground">Parsing recipe...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !isPending && (
            <View className="mb-4 rounded-xl bg-destructive/10 p-4">
              <Text className="mb-1 font-semibold text-destructive">Error</Text>
              <Text className="text-destructive">
                {getImportErrorMessage(
                  error.code as Parameters<typeof getImportErrorMessage>[0]
                )}
              </Text>
              <Text className="mt-2 text-sm text-muted-foreground">
                Code: {error.code}
              </Text>
              {error.rateLimitInfo && (
                <Text className="mt-1 text-sm text-muted-foreground">
                  Rate limit: {error.rateLimitInfo.remaining}/
                  {error.rateLimitInfo.limit} remaining, resets in{' '}
                  {error.rateLimitInfo.resetSeconds}s
                </Text>
              )}
            </View>
          )}

          {/* Success State */}
          {data && !isPending && (
            <View className="rounded-xl bg-card p-4">
              <Text className="mb-4 font-semibold text-green-600">
                Successfully parsed!
              </Text>

              {/* Recipe Metadata */}
              <View className="mb-4 rounded-lg bg-background p-3">
                <Text className="mb-1 text-sm font-medium text-muted-foreground">
                  Recipe Name
                </Text>
                <Text className="text-lg font-semibold">
                  {data.recipeName ?? 'Unnamed Recipe'}
                </Text>

                {data.servings && (
                  <>
                    <Text className="mb-1 mt-3 text-sm font-medium text-muted-foreground">
                      Servings
                    </Text>
                    <Text>{data.servings}</Text>
                  </>
                )}

                <Text className="mb-1 mt-3 text-sm font-medium text-muted-foreground">
                  Source URL
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {data.sourceUrl}
                </Text>
              </View>

              {/* Ingredients */}
              <View>
                <Text className="mb-3 font-semibold">
                  Ingredients ({data.ingredients.length})
                </Text>
                {data.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    className="mb-2 flex-row items-center justify-between rounded-lg bg-background p-3"
                  >
                    <View className="flex-1">
                      <Text className="font-medium">
                        {formatQuantity(ingredient.quantity, ingredient.unit)}{' '}
                        {ingredient.name}
                      </Text>
                      {ingredient.notes && (
                        <Text className="text-sm text-muted-foreground">
                          {ingredient.notes}
                        </Text>
                      )}
                    </View>
                    <CategoryTag category={ingredient.category} />
                  </View>
                ))}
              </View>

              {/* Raw JSON (for debugging) */}
              <View className="mt-4">
                <Text className="mb-2 text-sm font-medium text-muted-foreground">
                  Raw Response
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="rounded-lg bg-background p-3"
                >
                  <Text className="font-mono text-xs">
                    {JSON.stringify(data, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
