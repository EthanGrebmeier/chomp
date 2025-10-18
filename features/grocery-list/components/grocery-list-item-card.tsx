import { Pressable, View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { GroceryListWithItems } from '../types';

type GroceryListItemCardProps = {
  item: GroceryListWithItems;
  onPress: (item: GroceryListWithItems) => void;
  disabled?: boolean;
  className?: string;
};

export const GroceryListItemCard = ({
  item,
  onPress,
  disabled = false,
  className = '',
}: GroceryListItemCardProps) => {
  return (
    <Pressable
      onPress={() => onPress(item)}
      disabled={disabled}
      className={cn(
        `mb-2 rounded-lg border px-4 py-2 `,
        disabled ? 'opacity-50' : 'border-border bg-card',
        className
      )}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">{item.name}</Text>
        {item.date && (
          <Text className="text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Text className="text-sm text-muted-foreground">
        {item.items?.length || 0} items
      </Text>
    </Pressable>
  );
};
