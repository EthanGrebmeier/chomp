import { View } from 'react-native';

import { Checkbox } from '../../../components/ui/checkbox';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

type DefaultStoreToggleProps = {
  checked: boolean;
  onToggle: () => void;
  className?: string;
};

export const DefaultStoreToggle = ({
  checked,
  onToggle,
  className,
}: DefaultStoreToggleProps) => {
  return (
    <HapticPressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      className={cn(
        'flex-row items-center justify-between gap-4 rounded-xl border border-border  p-4',
        className
      )}
      hapticType="selection"
      onPress={onToggle}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">
          Default store
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Use this store for new grocery items when no store is selected.
        </Text>
      </View>
      <View pointerEvents="none">
        <Checkbox
          className="size-6 rounded-lg p-[3px]"
          checked={checked}
          onPress={onToggle}
        />
      </View>
    </HapticPressable>
  );
};
