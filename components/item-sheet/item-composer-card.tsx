import { XIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

/** Compact form surface shared by grocery, ingredient, and meal-plan editors. */
export function ItemComposerCard({
  title,
  header,
  headerActions,
  onClose,
  children,
  metadata,
  action,
}: {
  title: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  metadata: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View
      collapsable={false}
      className="overflow-hidden rounded-[32px] border border-border bg-background pb-2.5 pt-1.5"
    >
      <View className="min-h-11 flex-row items-center px-2">
        <HapticPressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title.toLowerCase()}`}
          className="size-11 items-center justify-center"
        >
          <Icon as={XIcon} size={20} className="text-muted-foreground" />
        </HapticPressable>
        <View className="min-w-0 flex-1 items-center">
          {header ?? (
            <Text
              className="text-center text-base font-semibold"
              numberOfLines={2}
            >
              {title}
            </Text>
          )}
        </View>
        {headerActions ?? <View className="size-11" />}
      </View>
      <View className="px-3">
        <View className="pl-1">{children}</View>
        <View className="mt-1 min-h-11 flex-row items-center gap-2">
          <View className="min-w-0 flex-1">{metadata}</View>
          {action}
        </View>
      </View>
    </View>
  );
}
