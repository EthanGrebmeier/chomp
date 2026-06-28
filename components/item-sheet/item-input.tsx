import { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cn } from '../../lib/utils';
import { BottomSheet } from '../bottom-sheet';
import { HapticPressable } from '../ui/haptic-pressable';
import { Text } from '../ui/text';

import { MatchingItem, useMatchingItems } from './use-matching-items';

type ItemInputProps = {
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
  const { matchingItems } = useMatchingItems(matchingValue);
  const isApplyingSuggestionRef = useRef(false);
  const hideSuggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  return (
    <View className="w-full">
      <BottomSheet.BareTextInput
        key={inputKey}
        ref={inputRef}
        className="text-2xl font-bold text-foreground"
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChangeText={handleChangeText}
        onBlur={handleInputBlur}
        autoCorrect={false}
        autoCapitalize="words"
        onSubmitEditing={onSubmit}
        submitBehavior={keepKeyboardOnSubmit ? 'submit' : 'blurAndSubmit'}
      />
      {shouldShowAutocomplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="absolute left-0 right-0 top-[75%] z-10  flex-row flex-wrap gap-1.5 overflow-hidden pt-4"
        >
          {matchingItems.map(item => (
            <Animated.View key={item.name}>
              <HapticPressable
                className={cn(
                  'flex-row items-center justify-between self-start rounded-xl border border-border bg-[#F3F4F6] px-2 py-0.5 dark:bg-[#1E2023]'
                )}
                onPressIn={handleSuggestionPressIn}
                onPress={() => handleSuggestionPress(item)}
              >
                <Text
                  allowFontScaling={false}
                  className={cn(
                    'text-lg font-medium text-black dark:text-white'
                  )}
                >
                  {item.name}
                </Text>
              </HapticPressable>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );
};
