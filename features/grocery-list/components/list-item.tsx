import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useCheckGroceryItem } from '../hooks/useCheckGroceryListItem';
import { useRemoveGroceryListItem } from '../hooks/useRemoveGroceryListItem';
import { queryKeys } from '../query-keys';
import { GroceryListItem } from '../types';

type ListItemProps = {
  item: GroceryListItem;
  isChecked: boolean;
  className?: string;
};

export const ListItem = ({ item, isChecked, className }: ListItemProps) => {
  const { mutate: checkItem } = useCheckGroceryItem();
  const { mutate: removeItem } = useRemoveGroceryListItem();
  const [shouldShowRemoveIcon, setShouldShowRemoveIcon] = useState(false);
  const queryClient = useQueryClient();
  const xPos = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xPos.value }],
  }));
  const screenWidth = useWindowDimensions().width;

  return (
    <Animated.View
      entering={FadeInDown.duration(140)}
      exiting={FadeOut.duration(140)}
    >
      <GestureDetector
        gesture={Gesture.Pan()
          .onUpdate(event => {
            if (event.velocityX > 0 && event.translationX > 0) {
              return;
            }
            xPos.value = event.translationX;
            console.log(Math.abs(event.translationX));
            console.log(screenWidth * 0.3);
            scheduleOnRN(
              setShouldShowRemoveIcon,
              Math.abs(event.translationX) > screenWidth * 0.3
            );
          })
          .onEnd(e => {
            'worklet';
            if (e.translationX < 0 - screenWidth * 0.3) {
              scheduleOnRN(removeItem, {
                itemId: item.id,
                groceryListId: item.groceryListId,
              });
            }
            xPos.value = withSpring(0);
          })}
      >
        <Animated.View className={cn('px-4', className)} style={animatedStyle}>
          <View
            className={cn('flex-row items-center gap-2 bg-background py-2')}
          >
            <Pressable
              className={cn(
                'size-6 overflow-hidden rounded-full border border-gray-300 p-0.5'
              )}
              onPress={() =>
                checkItem(
                  { itemId: item.id, isChecked: !isChecked },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.base(),
                      });
                    },
                  }
                )
              }
            >
              <View
                className={cn(
                  'h-full w-full rounded-full',
                  isChecked && 'bg-gray-500'
                )}
              ></View>
            </Pressable>

            <View className="flex-1 flex-row justify-between">
              <Text className="text-2xl font-medium">{item.name}</Text>
              <Text className="text-lg text-gray-500">x{item.quantity}</Text>
            </View>
          </View>
          <View className="absolute right-0 h-full w-[400] translate-x-full items-start justify-center bg-red-500 px-4">
            {shouldShowRemoveIcon && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <TrashIcon color="white" size={24} />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
