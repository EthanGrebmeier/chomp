import { XIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type UrlInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
};

export type UrlInputRef = {
  focus: () => void;
};

export const UrlInput = forwardRef<UrlInputRef, UrlInputProps>(
  ({ value, onChangeText, onSubmit, error, disabled }, ref) => {
    const inputRef = useRef<RNTextInput>(null);
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
    const placeholderColor = theme.mutedForeground;
    const iconColor = theme.foreground;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleClear = useCallback(() => {
      onChangeText('');
      inputRef.current?.focus();
    }, [onChangeText]);

    return (
      <View className="gap-2">
        <View className="flex-col gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Recipe URL
          </Text>
          <View className="relative flex-1">
            <RNTextInput
              ref={inputRef}
              value={value}
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
                'h-12 rounded-xl border bg-input px-4 pr-10 text-sm leading-4 text-foreground',
                error ? 'border-destructive' : 'border-border',
                disabled && 'opacity-50'
              )}
            />
            {value.length > 0 && !disabled && (
              <View className="absolute right-2 top-0 h-12 items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={handleClear}
                  className="h-8 w-8"
                  haptic
                >
                  <XIcon size={18} color={iconColor} />
                </Button>
              </View>
            )}
          </View>
        </View>
        {error && <Text className="text-sm text-destructive">{error}</Text>}
      </View>
    );
  }
);

UrlInput.displayName = 'UrlInput';
