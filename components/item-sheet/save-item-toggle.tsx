import { BookmarkIcon, LucideIcon, RefreshCwIcon } from 'lucide-react-native';

import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';

type SaveItemToggleProps = {
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  /**
   * When true the toggle syncs an existing saved item instead of creating a
   * new one, so it presents as "Sync changes". The underlying value is the
   * same deferred preference either way: the write happens on Add Item.
   */
  isSync?: boolean;
};

export const SaveItemToggle = ({
  value,
  onToggle,
  disabled = false,
  isSync = false,
}: SaveItemToggleProps) => {
  const label = isSync ? 'Sync changes' : 'Save item';
  const iconComponent: LucideIcon = isSync ? RefreshCwIcon : BookmarkIcon;

  return (
    <WithLayoutTransition>
      <HapticPressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={label}
        onPress={() => onToggle(!value)}
        hapticType="light"
        disabled={disabled}
      >
        <Pill
          className={cn(
            !value && 'border-dashed',
            value && 'bg-primary',
            disabled && 'opacity-50'
          )}
          icon={
            <Icon
              as={iconComponent}
              size={16}
              className={cn(
                value ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            />
          }
          textClassName={cn(
            'font-semibold',
            value ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
          hasValue={value}
        >
          {label}
        </Pill>
      </HapticPressable>
    </WithLayoutTransition>
  );
};
