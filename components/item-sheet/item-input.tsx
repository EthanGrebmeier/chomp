import { TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BaseGroceryItem } from '../../features/grocery-list/types';
import { cn } from '../../lib/utils';
import { BottomSheet } from '../bottom-sheet';
import { HapticPressable } from '../ui/haptic-pressable';
import { Text } from '../ui/text';

import { useMatchingItems } from './use-matching-items';

type ItemInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: BaseGroceryItem) => void;
  showMatchingItems: boolean;
  setShowMatchingItems: (show: boolean) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  disableAutocomplete?: boolean;
};

export const ItemInput = ({
  placeholder,
  value,
  onChangeText,
  onSelect,
  showMatchingItems,
  setShowMatchingItems,
  onSubmit,
  inputRef,
  disableAutocomplete = false,
}: ItemInputProps) => {
  const { matchingItems } = useMatchingItems(value);

  const shouldShowAutocomplete =
    !disableAutocomplete && showMatchingItems && matchingItems.length > 0;

  return (
    <View className="w-full">
      <BottomSheet.BareTextInput
        ref={inputRef}
        className="text-2xl font-bold text-foreground"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setShowMatchingItems(false)}
        autoCorrect={false}
        autoCapitalize="words"
        onSubmitEditing={onSubmit}
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
                onPress={() => onSelect(item)}
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
