import { useColorScheme } from 'nativewind';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

import { BottomSheet } from '../../../../components/bottom-sheet';

export type UrlInputProps = {
  inputKey: number;
  defaultValue: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export type UrlInputRef = {
  focus: () => void;
};

export const UrlInput = forwardRef<UrlInputRef, UrlInputProps>(
  (
    {
      inputKey,
      defaultValue,
      onChangeText,
      onSubmit,
      error,
      disabled,
      className,
    },
    ref
  ) => {
    const inputRef = useRef<RNTextInput>(null);
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
    const placeholderColor = theme.mutedForeground;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    return (
      <View className={cn('gap-2', className)}>
        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Recipe URL
          </Text>
          <BottomSheet.TextInput
            key={inputKey}
            ref={inputRef}
            defaultValue={defaultValue}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder="https://example.com/recipe"
            placeholderTextColor={placeholderColor}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            editable={!disabled}
            selectTextOnFocus
            className={cn(
              error ? 'border-destructive' : 'border-border',
              disabled && 'opacity-50'
            )}
          />
        </View>
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      </View>
    );
  }
);

UrlInput.displayName = 'UrlInput';
