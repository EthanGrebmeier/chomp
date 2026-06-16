import { TrashIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { GestureResponderEvent, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cn } from '@/lib/utils';

import { Icon } from './icon';

const SWIPE_PRESS_CANCEL_THRESHOLD = 8;

type ListItemProps = {
  className?: string;
  children?: React.ReactNode;
  onDelete?: () => void;
};

type SwipeableListItemProps = {
  className?: string;
  children?: React.ReactNode;
  onDelete: () => void;
};

const SwipeableListItem = ({
  className,
  children,
  onDelete,
}: SwipeableListItemProps) => {
  const screenWidth = useWindowDimensions().width;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const listItemXPos = useSharedValue(0);
  const listItemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: listItemXPos.get() }],
  }));
  const deleteThreshold = screenWidth * 0.5;

  const removeIconSlideOutXPos = useDerivedValue(() => {
    return Math.max(listItemXPos.get() + 48, 0);
  });

  const removeIconAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(listItemXPos.get());
    const opacity = Math.min(swipeDistance / deleteThreshold, 1);

    return {
      opacity: opacity,
      position: 'absolute',
      right: 16, // Always 16px from right edge
      top: '50%',
      transform: [
        { translateX: removeIconSlideOutXPos.get() },
        { translateY: '-50%' },
      ], // Center vertically (half of icon size)
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const swipeDistance = Math.abs(listItemXPos.get());
    const opacity = Math.min(swipeDistance / deleteThreshold, 1);
    // Map opacity from 0-1 to 0.7-1.0 (70% to 100%)
    const backgroundOpacity = 0.7 + opacity * 0.3;

    return {
      opacity: backgroundOpacity,
    };
  });

  const handleStartShouldSetResponderCapture = (
    event: GestureResponderEvent
  ) => {
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };

    return false;
  };

  const handleMoveShouldSetResponderCapture = (
    event: GestureResponderEvent
  ) => {
    const touchStart = touchStartRef.current;
    if (!touchStart) {
      return false;
    }

    const xDistance = Math.abs(event.nativeEvent.pageX - touchStart.x);
    const yDistance = Math.abs(event.nativeEvent.pageY - touchStart.y);

    return xDistance > SWIPE_PRESS_CANCEL_THRESHOLD && xDistance > yDistance;
  };

  const handleResponderRelease = () => {
    touchStartRef.current = null;
  };

  return (
    <View
      className="overflow-hidden"
      onResponderRelease={handleResponderRelease}
      onResponderTerminate={handleResponderRelease}
      onStartShouldSetResponderCapture={handleStartShouldSetResponderCapture}
      onMoveShouldSetResponderCapture={handleMoveShouldSetResponderCapture}
    >
      <Animated.View>
        <GestureDetector
          gesture={Gesture.Pan()
            .activeOffsetX([-10, 100])
            .failOffsetY([-5, 5])
            .onUpdate(event => {
              if (event.velocityX > 0 && event.translationX > 0) {
                return;
              }
              const amountOverThreshold = Math.max(
                -(deleteThreshold + event.translationX),
                0
              );

              listItemXPos.set(
                Math.max(event.translationX, -deleteThreshold) -
                  amountOverThreshold ** 0.5
              );
            })
            .onEnd(e => {
              'worklet';
              if (e.translationX < 0 - deleteThreshold) {
                // Animate the item off the screen first
                listItemXPos.set(
                  withSpring(-screenWidth - 24, { duration: 180 }, () => {
                    // After animation completes, trigger the delete mutation
                    scheduleOnRN(onDelete);
                  })
                );
              } else {
                // If threshold not reached, spring back to original position
                listItemXPos.set(withSpring(0));
              }
            })}
        >
          <Animated.View style={listItemAnimatedStyle}>
            <View
              className={cn(
                'z-10 flex-row items-center gap-2 px-4 py-1',
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

const BasicListItem = ({
  className,
  children,
}: Pick<ListItemProps, 'className' | 'children'>) => {
  return (
    <View className="overflow-hidden">
      <View
        className={cn('z-10 flex-row items-center gap-2 px-4 py-1', className)}
      >
        {children}
      </View>
    </View>
  );
};

export const ListItem = ({ className, children, onDelete }: ListItemProps) => {
  if (!onDelete) {
    return <BasicListItem className={className}>{children}</BasicListItem>;
  }

  return (
    <SwipeableListItem className={className} onDelete={onDelete}>
      {children}
    </SwipeableListItem>
  );
};
