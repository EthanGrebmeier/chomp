import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { cn } from '../../lib/utils';

import { HapticPressable } from './haptic-pressable';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  hitSlop?: number;
  className?: string;
};

const checkedKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0 }],
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  },
});

const uncheckedKeyframe = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  100: {
    opacity: 0,
    transform: [{ scale: 0 }],
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  },
});

export const Checkbox = ({
  checked,
  onPress,
  hitSlop = 10,
  className,
}: CheckboxProps) => {
  return (
    <HapticPressable
      hitSlop={hitSlop}
      className={cn(
        'size-5 overflow-hidden rounded-md border border-border  p-0.5',
        className
      )}
      onPress={onPress}
      hapticType="selection"
    >
      {checked && (
        <Animated.View
          entering={checkedKeyframe.duration(100)}
          exiting={uncheckedKeyframe.duration(150)}
          className={cn('h-full w-full rounded-sm bg-accent-foreground')}
        />
      )}
    </HapticPressable>
  );
};
