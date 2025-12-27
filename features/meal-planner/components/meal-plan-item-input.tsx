import { TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BottomSheet } from '../../../components/bottom-sheet';
import { useMatchingItems } from '../../../components/item-sheet/use-matching-items';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { cn } from '../../../lib/utils';

type MealPlanItemInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: BaseGroceryItem) => void;
  showMatchingItems: boolean;
  setShowMatchingItems: (show: boolean) => void;
  onSubmit: () => void;
  ref?: React.RefObject<TextInput | null>;
};

export const MealPlanItemInput = ({
  value,
  onChangeText,
  onSelect,
  showMatchingItems,
  setShowMatchingItems,
  onSubmit,
  ref,
}: MealPlanItemInputProps) => {
  const { matchingItems } = useMatchingItems(value);

  const shouldShowAutocomplete = showMatchingItems && matchingItems.length > 0;

  return (
    <View className="w-full">
      <BottomSheet.BareTextInput
        ref={ref}
        className="text-2xl font-bold text-foreground"
        placeholder="Item name"
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
          className="absolute left-0 right-0 top-full z-10 max-h-36 flex-row flex-wrap gap-2.5 overflow-hidden pt-4"
        >
          {matchingItems.map(item => (
            <Animated.View key={item.name}>
              <HapticPressable
                className={cn(
                  'flex-row items-center justify-between self-start rounded-sm bg-primary-foreground px-2 py-1'
                )}
                onPress={() => onSelect(item)}
              >
                <Text
                  allowFontScaling={false}
                  className={cn('text-lg font-bold text-black')}
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
