import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from 'lucide-react-native';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
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
  const queryClient = useQueryClient();
  const screenWidth = useWindowDimensions().width;
  const xPos = useSharedValue(0);
  const deleteThreshold = screenWidth * 0.3;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xPos.value }],
  }));
  const removeIconAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(xPos.value);
    const opacity = Math.min(swipeDistance / deleteThreshold, 1);

    return {
      opacity: opacity,
      position: 'absolute',
      right: 16, // Always 16px from right edge
      top: '50%',
      transform: [{ translateY: -12 }], // Center vertically (half of icon size)
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(xPos.value);
    const opacity = Math.min(swipeDistance / deleteThreshold, 1);
    // Map opacity from 0-1 to 0.7-1.0 (70% to 100%)
    const backgroundOpacity = 0.7 + opacity * 0.3;

    return {
      opacity: backgroundOpacity,
    };
  });

  return (
    <View>
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
            })
            .onEnd(e => {
              'worklet';
              if (e.translationX < 0 - deleteThreshold) {
                // Animate the item off the screen first
                xPos.value = withSpring(
                  -screenWidth - 24,
                  { duration: 180 },
                  () => {
                    // After animation completes, trigger the delete mutation
                    scheduleOnRN(removeItem, {
                      itemId: item.id,
                      groceryListId: item.groceryListId,
                    });
                  }
                );
              } else {
                // If threshold not reached, spring back to original position
                xPos.value = withSpring(0);
              }
            })}
        >
          <Animated.View
            className={cn('px-4', className)}
            style={animatedStyle}
          >
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
            <Animated.View
              className="absolute right-[-1200px] h-full w-[1200px] items-start justify-center bg-red-500 px-4"
              style={backgroundAnimatedStyle}
            ></Animated.View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
      <Animated.View style={removeIconAnimatedStyle}>
        <TrashIcon color="white" size={24} />
      </Animated.View>
    </View>
  );
};
