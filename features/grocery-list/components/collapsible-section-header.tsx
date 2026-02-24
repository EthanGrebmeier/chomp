import { ChevronDownIcon } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

type CollapsibleSectionHeaderProps = {
  title: string;
  itemCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClearPress?: () => void;
  showCollapse?: boolean;
};

export const CollapsibleSectionHeader = ({
  title,
  itemCount,
  isExpanded,
  onToggle,
  onClearPress,
  showCollapse = true,
}: CollapsibleSectionHeaderProps) => {
  return (
    <View className={cn('bg-background px-4 pt-1')}>
      {showCollapse ? (
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onToggle} className="flex-1">
            <Text className="text-base font-semibold capitalize text-foreground">
              {title}
            </Text>
            {itemCount !== undefined && (
              <Text className="text-sm text-muted-foreground">
                {itemCount} items
              </Text>
            )}
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            {isExpanded && onClearPress ? (
              <TouchableOpacity onPress={onClearPress}>
                <Text className="text-sm font-medium text-destructive">
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onToggle}>
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
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text className="text-lg font-semibold capitalize text-foreground">
          {title}
          {itemCount !== undefined && ` (${itemCount})`}
        </Text>
      )}
    </View>
  );
};
