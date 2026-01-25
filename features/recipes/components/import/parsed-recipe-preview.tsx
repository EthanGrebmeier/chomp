import { useRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Text } from '@/components/ui/text';

export type ParsedRecipePreviewProps = {
  recipeName: string;
  onNameChange: (name: string) => void;
  /** Maximum character length for the recipe name */
  maxNameLength?: number;
};

export const ParsedRecipePreview = ({
  recipeName,
  onNameChange,
  maxNameLength,
}: ParsedRecipePreviewProps) => {
  const nameInputRef = useRef<RNTextInput>(null);

  // Show character counter when within 20 characters of limit
  const showCharCount =
    maxNameLength && recipeName.length >= maxNameLength - 20;
  const isNearLimit = maxNameLength && recipeName.length >= maxNameLength - 10;
  const isAtLimit = maxNameLength && recipeName.length >= maxNameLength;

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
    </View>
  );
};
