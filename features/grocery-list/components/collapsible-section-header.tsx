import { ChevronDownIcon } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';

type CollapsibleSectionHeaderProps = {
  title: string;
  itemCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  showCollapse?: boolean;
};

export const CollapsibleSectionHeader = ({
  title,
  itemCount,
  isExpanded,
  onToggle,
  showCollapse = true,
}: CollapsibleSectionHeaderProps) => {
  return (
    <View className="bg-background px-4">
      {showCollapse ? (
        <TouchableOpacity
          onPress={onToggle}
          className="flex-row items-center justify-between"
        >
          <Text className="text-lg font-semibold capitalize text-foreground">
            {title}
            {itemCount !== undefined && ` (${itemCount})`}
          </Text>
          <Animated.View
            style={{
              transform: [{ rotate: isExpanded ? '0deg' : '180deg' }],
            }}
          >
            <Icon
              as={ChevronDownIcon}
              size={20}
              className="text-muted-foreground"
            />
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <Text className="text-lg font-semibold capitalize text-foreground">
          {title}
          {itemCount !== undefined && ` (${itemCount})`}
        </Text>
      )}
    </View>
  );
};
