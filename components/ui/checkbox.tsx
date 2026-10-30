import { useState } from 'react';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cn } from '../../lib/utils';

import { HapticPressable } from './haptic-pressable';
import { TogglePressable } from './toggle-pressable';

type CheckboxProps = {
  checked: boolean;
  /** Optional UI-runtime state for feedback before the controlled prop updates. */
  animatedChecked?: SharedValue<boolean>;
  onPress: () => void;
  onCheckedChange?: (checked: boolean) => void;
  hitSlop?: number;
  className?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export const Checkbox = ({
  checked,
  animatedChecked,
  onPress,
  onCheckedChange,
  hitSlop = 10,
  className,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) => {
  const progress = useSharedValue(checked ? 1 : 0);
  // Refresh only the fill layer after timing finishes. Reanimated captures
  // mount-time styles; a new layer keeps list moves from restoring old pixels.
  const [settledChecked, setSettledChecked] = useState(checked);

  useAnimatedReaction(
    () => animatedChecked?.get() ?? checked,
    (nextChecked, previousChecked) => {
      if (nextChecked === previousChecked) {
        return;
      }

      progress.set(
        withTiming(
          nextChecked ? 1 : 0,
          {
            duration: nextChecked ? 100 : 150,
            easing: Easing.out(Easing.cubic),
          },
          finished => {
            if (finished) scheduleOnRN(setSettledChecked, nextChecked);
          }
        )
      );
    }
  );

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.95 + 0.05 * progress.get() }],
  }));

  const content = (
    <Animated.View
      pointerEvents="none"
      key={settledChecked ? 'checked' : 'unchecked'}
      style={fillStyle}
      className="h-full w-full rounded-sm bg-accent-foreground"
    />
  );
  const containerClassName = cn(
    'size-5 overflow-hidden rounded-md border border-border p-0.5',
    className
  );
  if (animatedChecked && onCheckedChange) {
    return (
      <TogglePressable
        checked={checked}
        animatedChecked={animatedChecked}
        onChange={onCheckedChange}
        hitSlop={hitSlop}
        className={containerClassName}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </TogglePressable>
    );
  }
  return (
    <HapticPressable
      hitSlop={hitSlop}
      className={containerClassName}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      hapticType="selection"
    >
      {content}
    </HapticPressable>
  );
};
