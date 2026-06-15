import { useEffect, useRef, useState } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';

import { BottomSheet } from '@/components/bottom-sheet';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';

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
  const nameInput = useUncontrolledTextInput(recipeName);
  const [nameLength, setNameLength] = useState(recipeName.length);
  const debouncedOnNameChange = useDebounceCallback(onNameChange, 300);

  useEffect(() => {
    nameInput.reset(recipeName);
    setNameLength(recipeName.length);
  }, [nameInput.reset, recipeName]);

  const handleNameChange = (name: string) => {
    nameInput.handleChangeText(name);
    setNameLength(name.length);
    debouncedOnNameChange(name);
  };

  // Show character counter when within 20 characters of limit
  const showCharCount =
    maxNameLength && nameLength >= maxNameLength - 20;
  const isNearLimit = maxNameLength && nameLength >= maxNameLength - 10;
  const isAtLimit = maxNameLength && nameLength >= maxNameLength;

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
              {nameLength}/{maxNameLength}
            </Text>
          )}
        </View>
        <BottomSheet.TextInput
          key={nameInput.inputKey}
          ref={nameInputRef}
          defaultValue={nameInput.defaultValue}
          onChangeText={handleNameChange}
          placeholder="Enter recipe name"
          autoCapitalize="words"
          selectTextOnFocus
          maxLength={maxNameLength}
        />
      </View>
    </View>
  );
};
