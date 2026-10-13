import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { cn } from '../../lib/utils';

import { HapticPressable } from './haptic-pressable';

type CheckboxProps = {
  checked: boolean;
  /** Optional UI-runtime state for feedback before the controlled prop updates. */
  animatedChecked?: SharedValue<boolean>;
  onPress: () => void;
  hitSlop?: number;
  className?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export const Checkbox = ({
  checked,
  animatedChecked,
  onPress,
  hitSlop = 10,
  className,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) => {
  const progress = useSharedValue(checked ? 1 : 0);

  useAnimatedReaction(
    () => animatedChecked?.get() ?? checked,
    (nextChecked, previousChecked) => {
      if (nextChecked === previousChecked) {
        return;
      }

      progress.set(
        withTiming(nextChecked ? 1 : 0, {
          duration: nextChecked ? 100 : 150,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  );

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.95 + 0.05 * progress.get() }],
  }));

  return (
    <HapticPressable
      hitSlop={hitSlop}
      className={cn(
        'size-5 overflow-hidden rounded-md border border-border  p-0.5',
        className
      )}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      hapticType="selection"
    >
      <Animated.View
        pointerEvents="none"
        style={fillStyle}
        className="h-full w-full rounded-sm bg-accent-foreground"
      />
    </HapticPressable>
  );
};
