import { ReactNode, useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';

import { cn } from '../../lib/utils';
import { HapticPressable } from '../ui/haptic-pressable';
import { Text } from '../ui/text';

import { ItemNameField } from './item-fields';
import { MatchingItem, useMatchingItems } from './use-matching-items';

type ItemInputProps = {
  renderContent?: (input: ReactNode, suggestions: ReactNode) => ReactNode;
  compact?: boolean;
  placeholder: string;
  inputKey: number;
  defaultValue: string;
  matchingValue: string;
  onChangeText: (text: string) => void;
  onSelect: (item: MatchingItem) => void;
  showMatchingItems: boolean;
  setShowMatchingItems: (show: boolean) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  disableAutocomplete?: boolean;
  keepKeyboardOnSubmit?: boolean;
};

export const ItemInput = ({
  renderContent,
  compact = false,
  placeholder,
  inputKey,
  defaultValue,
  matchingValue,
  onChangeText,
  onSelect,
  showMatchingItems,
  setShowMatchingItems,
  onSubmit,
  inputRef,
  disableAutocomplete = false,
  keepKeyboardOnSubmit = false,
}: ItemInputProps) => {
  const { matchingItems } = useMatchingItems(
    matchingValue,
    renderContent ? 12 : 7
  );
  const isApplyingSuggestionRef = useRef(false);
  const hideSuggestionsTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      if (hideSuggestionsTimeoutRef.current) {
        clearTimeout(hideSuggestionsTimeoutRef.current);
      }
    };
  }, []);

  const shouldShowAutocomplete =
    !disableAutocomplete && showMatchingItems && matchingItems.length > 0;

  const handleChangeText = (text: string) => {
    if (isApplyingSuggestionRef.current) {
      return;
    }
    onChangeText(text);
  };

  const handleSuggestionPress = (item: MatchingItem) => {
    isApplyingSuggestionRef.current = true;
    if (hideSuggestionsTimeoutRef.current) {
      clearTimeout(hideSuggestionsTimeoutRef.current);
      hideSuggestionsTimeoutRef.current = null;
    }
    onChangeText(item.name);
    inputRef?.current?.setNativeProps({ text: item.name });
    onSelect(item);
    setShowMatchingItems(false);
    setTimeout(() => {
      isApplyingSuggestionRef.current = false;
    }, 0);
  };

  const handleSuggestionPressIn = () => {
    isApplyingSuggestionRef.current = true;
    if (hideSuggestionsTimeoutRef.current) {
      clearTimeout(hideSuggestionsTimeoutRef.current);
      hideSuggestionsTimeoutRef.current = null;
    }
  };

  const handleInputBlur = () => {
    hideSuggestionsTimeoutRef.current = setTimeout(() => {
      if (isApplyingSuggestionRef.current) {
        return;
      }
      setShowMatchingItems(false);
    }, 75);
  };

  const input = (
    <ItemNameField
      {...(compact
        ? {
            className:
              'min-h-0 py-1 text-2xl font-semibold leading-8 text-foreground',
          }
        : {})}
      key={inputKey}
      ref={inputRef}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChangeText={handleChangeText}
      onBlur={handleInputBlur}
      onSubmitEditing={onSubmit}
      submitBehavior={keepKeyboardOnSubmit ? 'submit' : 'blurAndSubmit'}
    />
  );
  const suggestions = shouldShowAutocomplete ? (
    <View
      className={cn(
        'flex-row flex-wrap',
        renderContent
          ? '-mx-0.5'
          : 'absolute left-0 right-0 top-[75%] z-10 gap-1.5 overflow-hidden pt-4'
      )}
    >
      {matchingItems.map((item, index) => (
        <View
          key={`${item.source}:${item.cloudSavedItemId ?? item.localSavedItemId}`}
          style={
            renderContent
              ? {
                  width: '50%',
                  padding: 3,
                  // Keep ranking order, with the incomplete row at the top.
                  marginRight:
                    index === 0 && matchingItems.length % 2 === 1 ? '50%' : 0,
                }
              : undefined
          }
        >
          <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={`Use ${item.name}`}
            className={cn(
              'justify-center rounded-xl bg-background px-3 py-1 shadow-sm shadow-black/5',
              renderContent ? 'min-h-11 flex-1' : 'self-start'
            )}
            onPressIn={handleSuggestionPressIn}
            onPress={() => handleSuggestionPress(item)}
            onPressOut={() => {
              isApplyingSuggestionRef.current = false;
            }}
          >
            <Text
              numberOfLines={renderContent ? 2 : undefined}
              className={cn(
                'font-medium text-foreground',
                renderContent ? 'text-sm leading-4' : 'text-lg'
              )}
            >
              {item.name}
            </Text>
          </HapticPressable>
        </View>
      ))}
    </View>
  ) : null;

  return renderContent ? (
    renderContent(input, suggestions)
  ) : (
    <View className="w-full">
      {input}
      {suggestions}
    </View>
  );
};
