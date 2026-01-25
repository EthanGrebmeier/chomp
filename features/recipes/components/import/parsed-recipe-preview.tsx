import { ExternalLinkIcon, UtensilsIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef } from 'react';
import { Linking, TextInput as RNTextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

export type ParsedRecipePreviewProps = {
  recipeName: string;
  onNameChange: (name: string) => void;
  servings: string | null;
  sourceUrl: string;
  ingredientCount: number;
  /** Maximum character length for the recipe name */
  maxNameLength?: number;
};

export const ParsedRecipePreview = ({
  recipeName,
  onNameChange,
  servings,
  sourceUrl,
  ingredientCount,
  maxNameLength,
}: ParsedRecipePreviewProps) => {
  const nameInputRef = useRef<RNTextInput>(null);
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  
  // Show character counter when within 20 characters of limit
  const showCharCount = maxNameLength && recipeName.length >= maxNameLength - 20;
  const isNearLimit = maxNameLength && recipeName.length >= maxNameLength - 10;
  const isAtLimit = maxNameLength && recipeName.length >= maxNameLength;

  // Truncate URL to show domain + path start
  const truncateUrl = (url: string, maxLength = 40) => {
    try {
      const urlObj = new URL(url);
      const display = urlObj.hostname + urlObj.pathname;
      if (display.length > maxLength) {
        return display.substring(0, maxLength - 3) + '...';
      }
      return display;
    } catch {
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  };

  const handleOpenUrl = () => {
    Linking.openURL(sourceUrl);
  };

  return (
    <View className="gap-4">
      {/* Recipe Name - Editable */}
      <View>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted-foreground">
            Recipe Name
          </Text>
          {showCharCount && maxNameLength && (
            <Text
              className={`text-xs ${
                isAtLimit
                  ? 'text-destructive'
                  : isNearLimit
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
              }`}
            >
              {recipeName.length}/{maxNameLength}
            </Text>
          )}
        </View>
        <BottomSheet.TextInput
          ref={nameInputRef}
          value={recipeName}
          onChangeText={onNameChange}
          placeholder="Enter recipe name"
          selectTextOnFocus
          maxLength={maxNameLength}
        />
      </View>

      {/* Source URL - Read-only with link */}
      <View>
        <Text className="mb-2 text-sm font-medium text-muted-foreground">
          Source
        </Text>
        <Button
          variant="ghost"
          onPress={handleOpenUrl}
          className="h-auto flex-row items-center justify-start gap-2 px-0 py-1"
        >
          <ExternalLinkIcon size={16} color={theme.primary} />
          <Text className="text-sm text-primary" numberOfLines={1}>
            {truncateUrl(sourceUrl)}
          </Text>
        </Button>
      </View>

      {/* Servings and Ingredient Count - Read-only */}
      <View className="flex-row items-center gap-4">
        {servings && (
          <View className="flex-row items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <UtensilsIcon size={14} color={theme.mutedForeground} />
            <Text className="text-sm text-muted-foreground">{servings}</Text>
          </View>
        )}
        <View className="rounded-lg bg-primary/10 px-3 py-2">
          <Text className="text-sm font-medium text-primary">
            {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};
