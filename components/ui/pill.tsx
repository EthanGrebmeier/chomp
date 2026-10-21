import { XIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { cn } from '@/lib/utils';

import { HapticPressable } from './haptic-pressable';
import { Icon } from './icon';
import { Text } from './text';

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
  },
});

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
    <View>
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-lg bg-muted px-3 py-1',
          hasValue && onClear && 'pr-8',
          className
        )}
        style={styles.container}
      >
        {icon}
        <Text
          variant="label"
          className={cn(
            'text-base leading-5',
            !hasValue && 'text-muted-foreground',
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
          onPressIn={event => {
            event?.stopPropagation?.();
          }}
          onPressOut={event => {
            event?.stopPropagation?.();
          }}
          hitSlop={10}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          hapticType="light"
        >
          <Icon className={closeIconClassName} as={XIcon} size={16} />
        </HapticPressable>
      )}
    </View>
  );
};
