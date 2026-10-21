import { ReactNode, useEffect, useRef } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { cn } from '../../lib/utils';
import { HapticPressable } from '../ui/haptic-pressable';
import { Text } from '../ui/text';

import {
  getSuggestionTreatment,
  useSuggestionStyle,
} from './add-item/suggestion-style';
import { ItemNameField } from './item-fields';
import { MatchingItem, useMatchingItems } from './use-matching-items';

type ItemInputProps = {
  renderContent?: (input: ReactNode, suggestions: ReactNode) => ReactNode;
  compact?: boolean;
  placeholder: string;
  inputKey: number;
  defaultValue: string;
  value: string;
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
  value,
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
  const suggestionStyle = useSuggestionStyle();
  const suggestionTreatment = getSuggestionTreatment(suggestionStyle);
  const suggestionLayout = suggestionTreatment.layout;
  const { matchingItems } = useMatchingItems(matchingValue, 12);
  const isPressingSuggestionRef = useRef(false);

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
    onChangeText(text);
  };

  const handleSuggestionPress = (item: MatchingItem) => {
    isPressingSuggestionRef.current = true;
    if (hideSuggestionsTimeoutRef.current) {
      clearTimeout(hideSuggestionsTimeoutRef.current);
      hideSuggestionsTimeoutRef.current = null;
    }
    // Let React Native synchronize text and its native event count together.
    // Imperative text writes can be rejected after the user has edited a pick.
    onSelect(item);
    inputRef?.current?.focus();
    setShowMatchingItems(false);
    isPressingSuggestionRef.current = false;
  };

  const handleSuggestionPressIn = () => {
    isPressingSuggestionRef.current = true;
    if (hideSuggestionsTimeoutRef.current) {
      clearTimeout(hideSuggestionsTimeoutRef.current);
      hideSuggestionsTimeoutRef.current = null;
    }
  };

  const handleInputBlur = () => {
    hideSuggestionsTimeoutRef.current = setTimeout(() => {
      if (isPressingSuggestionRef.current) {
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
      value={value}
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
        suggestionLayout === 'list'
          ? 'overflow-hidden rounded-2xl bg-white px-3 dark:bg-neutral-800'
          : '-mx-0.5'
      )}
    >
      {matchingItems.map((item, index) => (
        <View
          key={`${item.source}:${item.cloudSavedItemId ?? item.localSavedItemId}`}
          style={{
            width:
              suggestionLayout === 'list'
                ? '100%'
                : suggestionLayout === 'grid'
                  ? '50%'
                  : undefined,
            maxWidth: '100%',
            padding: suggestionLayout === 'list' ? 0 : 3,
            // Keep ranking order, with the incomplete row at the top.
            marginRight:
              suggestionLayout === 'grid' &&
              index === 0 &&
              matchingItems.length % 2 === 1
                ? '50%'
                : 0,
          }}
        >
          <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={`Use ${item.name}`}
            style={
              suggestionLayout !== 'grid'
                ? { shadowOpacity: 0, elevation: 0 }
                : undefined
            }
            className={cn(
              'min-h-11 flex-1 justify-center rounded-xl border border-transparent px-3 py-1 shadow-sm shadow-black/5',
              suggestionTreatment.className,
              suggestionLayout === 'list' &&
                index > 0 &&
                'border-t-neutral-200 dark:border-t-neutral-700'
            )}
            onPressIn={handleSuggestionPressIn}
            onPress={() => handleSuggestionPress(item)}
            onPressOut={() => {
              isPressingSuggestionRef.current = false;
            }}
          >
            <Text
              numberOfLines={2}
              className={cn(
                'text-sm font-medium leading-4 text-foreground',
                suggestionTreatment.textClassName
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
      {suggestions ? (
        <ScrollView
          style={{ maxHeight: 200, flexGrow: 0 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {suggestions}
        </ScrollView>
      ) : null}
      {input}
    </View>
  );
};
