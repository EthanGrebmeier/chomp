import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BottomSheet } from '../../../../components/bottom-sheet';
import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

import { useAddItem } from './useAddItem';
import { useMatchingItems } from './useMatchingItems';

type ItemInputProps = {
  placeholder: string;
};

export const ItemInput = ({ placeholder }: ItemInputProps) => {
  const {
    inputValue,
    inputRef,
    showMatchingItems,
    setShowMatchingItems,
    onChangeText,
    onSelect,
  } = useAddItem();
  const { matchingItems } = useMatchingItems(inputValue);

  return (
    <View className="w-full">
      <BottomSheet.BareTextInput
        ref={inputRef}
        className="text-2xl font-bold text-foreground"
        placeholder={placeholder}
        value={inputValue}
        onChangeText={onChangeText}
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
