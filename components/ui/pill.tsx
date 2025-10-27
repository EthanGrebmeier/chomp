import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { HapticPressable } from './haptic-pressable';
import { Icon } from './icon';
import { Text } from './text';

type PillProps = {
  children: ReactNode;
  onClear?: () => void;
  className?: string;
  icon?: ReactNode;
  hasValue?: boolean;
  textClassName?: string;
  closeIconClassName?: string;
};

export const Pill = ({
  children,
  onClear,
  className,
  textClassName,
  icon,
  hasValue = false,
  closeIconClassName,
}: PillProps) => {
  return (
    <View className="self-start">
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-full border border-border px-2 py-1',
          hasValue && onClear && 'pr-8',
          className
        )}
      >
        {icon}
        <Text
          className={cn(
            'text-base font-medium',
            hasValue ? 'text-foreground' : 'text-muted-foreground',
            textClassName
          )}
        >
          {children}
        </Text>
      </View>
      {hasValue && onClear && (
        <HapticPressable
          onPress={event => {
            event?.stopPropagation?.();
            onClear();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          hapticType="light"
        >
          <Icon className={closeIconClassName} as={XIcon} size={16} />
        </HapticPressable>
      )}
    </View>
  );
};
