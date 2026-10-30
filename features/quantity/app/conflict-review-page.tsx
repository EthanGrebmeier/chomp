import { useLayoutEffect, type ReactNode } from 'react';
import Animated, {
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SHEET_SCREEN_MOTION } from '@/components/animated/sheet-motion';

/** Retain the departing page as an inert overlay while the new page enters. */
export function ConflictReviewPage({
  active,
  direction,
  revision,
  onExited,
  children,
}: {
  active: boolean;
  direction: number;
  revision: number;
  onExited: (revision: number) => void;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(revision === 0 ? 1 : 0);
  const offset = useSharedValue(
    revision === 0 || reducedMotion
      ? 0
      : direction * SHEET_SCREEN_MOTION.distance
  );
  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: offset.get() }],
  }));

  useLayoutEffect(() => {
    const timing = {
      duration: active
        ? SHEET_SCREEN_MOTION.enterDuration
        : SHEET_SCREEN_MOTION.exitDuration,
      easing: SHEET_SCREEN_MOTION.easing,
      reduceMotion: ReduceMotion.Never,
    };
    offset.set(
      withTiming(
        active || reducedMotion ? 0 : -direction * SHEET_SCREEN_MOTION.distance,
        timing
      )
    );
    opacity.set(
      withTiming(active ? 1 : 0, timing, finished => {
        if (finished && !active) scheduleOnRN(onExited, revision);
      })
    );
    return () => {
      cancelAnimation(offset);
      cancelAnimation(opacity);
    };
  }, [active, direction, revision, reducedMotion, offset, opacity, onExited]);

  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={[
        !active && { position: 'absolute', top: 0, left: 0, right: 0 },
        style,
      ]}
      className="gap-5 px-8"
    >
      {children}
    </Animated.View>
  );
}
