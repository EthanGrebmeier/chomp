import { cn } from '@/lib/utils';
import { TrashIcon } from 'lucide-react-native';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from './icon';

type ListItemProps = {
  className?: string;
  children?: React.ReactNode;
  onDelete?: () => void;
};

export const ListItem = ({ className, children, onDelete }: ListItemProps) => {
  const screenWidth = useWindowDimensions().width;

  const listItemXPos = useSharedValue(0);
  const listItemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: listItemXPos.value }],
  }));
  const deleteThreshold = screenWidth * 0.5;

  const removeIconSlideOutXPos = useDerivedValue(() => {
    return Math.max(listItemXPos.value + 48, 0);
  });

  const removeIconAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(listItemXPos.value);
    const opacity = Math.min(swipeDistance / deleteThreshold, 1);

    return {
      opacity: opacity,
      position: 'absolute',
      right: 16, // Always 16px from right edge
      top: '50%',
      transform: [
        { translateX: removeIconSlideOutXPos.value },
        { translateY: '-50%' },
      ], // Center vertically (half of icon size)
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(listItemXPos.value);
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
        layout={LinearTransition}
      >
        <GestureDetector
          gesture={Gesture.Pan()
            .activeOffsetX([-10, 100])
            .failOffsetY([-5, 5])
            .onUpdate(event => {
              if (
                (event.velocityX > 0 && event.translationX > 0) ||
                !onDelete
              ) {
                return;
              }
              const amountOverThreshold = Math.max(
                -(deleteThreshold + event.translationX),
                0
              );

              listItemXPos.value =
                Math.max(event.translationX, -deleteThreshold) -
                amountOverThreshold ** 0.5;
            })
            .onEnd(e => {
              'worklet';
              if (e.translationX < 0 - deleteThreshold) {
                // Animate the item off the screen first
                listItemXPos.value = withSpring(
                  -screenWidth - 24,
                  { duration: 180 },
                  () => {
                    // After animation completes, trigger the delete mutation
                    onDelete && scheduleOnRN(onDelete);
                  }
                );
              } else {
                // If threshold not reached, spring back to original position
                listItemXPos.value = withSpring(0);
              }
            })}
        >
          <Animated.View style={listItemAnimatedStyle}>
            <View
              className={cn(
                'z-10 flex-row items-center gap-2 px-4 py-2',
                className
              )}
            >
              {children}
            </View>
            <Animated.View
              className="absolute left-full h-full w-[1200px] items-start justify-center bg-red-500 px-4"
              style={backgroundAnimatedStyle}
            ></Animated.View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
      <Animated.View style={removeIconAnimatedStyle}>
        <Icon as={TrashIcon} color="white" size={24} />
      </Animated.View>
    </View>
  );
};
