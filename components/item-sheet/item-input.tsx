import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cn } from '../../lib/utils';
import { BottomSheet } from '../bottom-sheet';
import { HapticPressable } from '../ui/haptic-pressable';
import { Text } from '../ui/text';

import { useItemSheet } from './use-item-sheet';
import { useMatchingItems } from './use-matching-items';

type ItemInputProps = {
  placeholder: string;
};

export const ItemInput = ({ placeholder }: ItemInputProps) => {
  const {
    itemInputValue,
    itemInputRef,
    showMatchingItems,
    setShowMatchingItems,
    onChangeItemText,
    onSelect,
  } = useItemSheet();
  const { matchingItems } = useMatchingItems(itemInputValue);

  return (
    <View className="w-full">
      <BottomSheet.BareTextInput
        ref={itemInputRef}
        className="text-2xl font-bold text-foreground"
        placeholder={placeholder}
        value={itemInputValue}
        onChangeText={onChangeItemText}
        onBlur={() => setShowMatchingItems(false)}
      />
      {showMatchingItems && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="absolute left-0 right-0 top-full z-10 flex-row flex-wrap gap-2.5 pt-4"
        >
          {matchingItems.map(item => (
            <Animated.View key={item.name}>
              <HapticPressable
                className={cn(
                  'flex-row items-center justify-between self-start rounded-sm bg-primary-foreground px-2 py-1'
                )}
                onPress={() => onSelect(item)}
              >
                <Text className={cn('text-lg font-bold text-black')}>
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
