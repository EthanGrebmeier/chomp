import { View } from 'react-native';

import { cn } from '../../lib/utils';

import { HapticPressable } from './haptic-pressable';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  hitSlop?: number;
  className?: string;
};

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
      <View
        className={cn(
          'h-full w-full rounded-full',
          checked && 'bg-accent-foreground'
        )}
      />
    </HapticPressable>
  );
};
