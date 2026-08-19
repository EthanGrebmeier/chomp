import { ChevronDownIcon } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

type CollapsibleSectionHeaderProps = {
  title: string;
  itemCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  showCollapse?: boolean;
};

const CollapsibleSectionHeaderComponent = ({
  title,
  itemCount,
  isExpanded,
  onToggle,
  actionLabel,
  onActionPress,
  showCollapse = true,
}: CollapsibleSectionHeaderProps) => {
  return (
    <View className={cn('bg-background px-4 pt-1')}>
      {showCollapse ? (
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onToggle} className="flex-1">
            <Text className="font-semibold capitalize text-foreground">
              {title}
            </Text>
            {itemCount !== undefined ? (
              <Text variant="caption" tabularNumbers>
                {itemCount} items
              </Text>
            ) : null}
          </Pressable>
          <View className="flex-row items-center gap-3">
            {isExpanded && actionLabel && onActionPress ? (
              <Pressable onPress={onActionPress}>
                <Text className="text-sm font-medium text-muted-foreground">
                  {actionLabel}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onToggle}>
              <Animated.View
                style={{
                  transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                }}
              >
                <Icon
                  as={ChevronDownIcon}
                  size={20}
                  className="text-muted-foreground"
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text
          tabularNumbers
          className="text-lg font-semibold capitalize leading-7 text-foreground"
        >
          {title}
          {itemCount !== undefined ? ` (${itemCount})` : null}
        </Text>
      )}
    </View>
  );
};

export const CollapsibleSectionHeader = memo(
  CollapsibleSectionHeaderComponent,
  (previousProps, nextProps) =>
    previousProps.title === nextProps.title &&
    previousProps.itemCount === nextProps.itemCount &&
    previousProps.isExpanded === nextProps.isExpanded &&
    previousProps.actionLabel === nextProps.actionLabel &&
    previousProps.showCollapse === nextProps.showCollapse &&
    previousProps.onToggle === nextProps.onToggle &&
    previousProps.onActionPress === nextProps.onActionPress
);
