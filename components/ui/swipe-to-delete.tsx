import * as Haptics from 'expo-haptics';
import { TrashIcon } from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cn } from '@/lib/utils';

import { Icon } from './icon';

// Width the row rests at once opened, revealing the trash action.
const SWIPE_REST_WIDTH = 88;
// Fraction of the screen the row must pass for a release to commit a delete.
const FULL_SWIPE_FRACTION = 0.45;
// How much of the drag beyond the commit threshold is tracked (rubber-banding).
const OVERSHOOT_RESISTANCE = 0.5;
// Quick, decelerating settle back to the open/closed resting positions.
const SETTLE_TIMING = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
} as const;
// Row accelerates off-screen once a delete is committed.
const DELETE_SWEEP_TIMING = {
  duration: 220,
  easing: Easing.in(Easing.cubic),
} as const;

const triggerThresholdHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export type SwipeToDeleteHandle = {
  close: () => void;
};

export type SwipeToDeleteProps = {
  children: React.ReactNode;
  onDelete: () => void;
  /**
   * Background applied to the sliding layer. It must be opaque so it covers the
   * trash icon behind it until the row physically slides past the icon.
   * @default 'bg-background'
   */
  contentClassName?: string;
};

/**
 * Native-style swipe-to-delete. A light swipe rests open to reveal a trash
 * icon; swiping past ~45% of the screen and releasing commits the delete by
 * sweeping the row (and its red backdrop) off-screen. A medium haptic fires
 * when crossing the commit threshold.
 */
export const SwipeToDelete = forwardRef<
  SwipeToDeleteHandle,
  SwipeToDeleteProps
>(({ children, onDelete, contentClassName }, ref) => {
  const screenWidth = useWindowDimensions().width;
  const fullSwipeThreshold = screenWidth * FULL_SWIPE_FRACTION;

  // Negative when the row is swiped open to the left.
  const translateX = useSharedValue(0);
  // Row position captured when the pan gesture starts.
  const startX = useSharedValue(0);
  // Tracks whether the full-swipe threshold is currently crossed so the
  // haptic only fires on the transition into it.
  const isPastThreshold = useSharedValue(false);

  const close = useCallback(() => {
    translateX.value = withTiming(0, SETTLE_TIMING);
    isPastThreshold.value = false;
  }, [translateX, isPastThreshold]);

  useImperativeHandle(ref, () => ({ close }), [close]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate(event => {
      const raw = startX.value + event.translationX;
      // Never allow the row to move past its closed resting position.
      let next = Math.min(raw, 0);

      // Apply rubber-band resistance once dragged past the commit threshold.
      const overshoot = -next - fullSwipeThreshold;
      if (overshoot > 0) {
        next = -fullSwipeThreshold - overshoot * OVERSHOOT_RESISTANCE;
      }

      const crossed = -next >= fullSwipeThreshold;
      if (crossed !== isPastThreshold.value) {
        isPastThreshold.value = crossed;
        if (crossed) {
          scheduleOnRN(triggerThresholdHaptic);
        }
      }

      translateX.value = next;
    })
    .onEnd(event => {
      const position = -translateX.value;
      isPastThreshold.value = false;

      if (position >= fullSwipeThreshold) {
        // Commit the delete: sweep the row and red backdrop off-screen left.
        translateX.value = withTiming(
          -screenWidth,
          DELETE_SWEEP_TIMING,
          finished => {
            if (finished) {
              scheduleOnRN(onDelete);
            }
          }
        );
        return;
      }

      const flingOpen = event.velocityX < -600;
      const flingClose = event.velocityX > 600;
      const shouldOpen =
        !flingClose && (flingOpen || position > SWIPE_REST_WIDTH * 0.5);

      translateX.value = withTiming(
        shouldOpen ? -SWIPE_REST_WIDTH : 0,
        SETTLE_TIMING
      );
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    width: Math.max(-translateX.value, 0),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          -translateX.value,
          [fullSwipeThreshold - 24, fullSwipeThreshold],
          [1, 1.2],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View className="overflow-hidden">
      <Animated.View
        className="absolute inset-y-0 right-0 items-center justify-center bg-destructive"
        style={backdropStyle}
      >
        <Animated.View className="absolute right-8" style={iconStyle}>
          <Pressable
            hitSlop={16}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete item"
          >
            <Icon as={TrashIcon} color="white" size={22} />
          </Pressable>
        </Animated.View>
      </Animated.View>
      {/*
       * The sliding layer needs a solid background so it covers the trash icon
       * behind it until the row physically slides past the icon.
       */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className={cn('bg-background', contentClassName)}
          style={contentStyle}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

SwipeToDelete.displayName = 'SwipeToDelete';
