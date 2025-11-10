import { useQueryClient } from '@tanstack/react-query';
import { CookingPotIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CategoryTag } from '../../../components/category-tag';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useCheckGroceryItem } from '../hooks/useCheckGroceryListItem';
import { useRemoveGroceryListItem } from '../hooks/useRemoveGroceryListItem';
import { GroceryListItemWithRecipe } from '../types';

type GroceryListItemProps = {
  item: GroceryListItemWithRecipe;
  isChecked: boolean;
  className?: string;
  onEdit?: () => void;
};

export const GroceryListItem = ({
  item,
  isChecked,
  className,
  onEdit,
}: GroceryListItemProps) => {
  const [internalIsChecked, setInternalIsChecked] = useState(isChecked);
  const { mutate: checkItem } = useCheckGroceryItem();
  const queryClient = useQueryClient();
  const { mutate: removeItem } = useRemoveGroceryListItem();

  // Animated value for strikethrough
  const strikethroughWidth = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    strikethroughWidth.value = withTiming(internalIsChecked ? 1 : 0, {
      duration: 300,
    });
  }, [internalIsChecked]);

  const strikethroughStyle = useAnimatedStyle(() => {
    return {
      width: `${strikethroughWidth.value * 100}%`,
    };
  });

  const onCheck = () => {
    if (internalIsChecked) {
      checkItem({ itemId: item.id, isChecked: false });
    } else {
      setTimeout(() => {
        checkItem({ itemId: item.id, isChecked: true });
      }, 1000);
    }
    setInternalIsChecked(!internalIsChecked);
  };

  return (
    <ListItem
      onDelete={() => removeItem({ itemId: item.id })}
      className={className}
    >
      <HapticPressable
        hitSlop={10}
        className={cn(
          'size-6 overflow-hidden rounded-full border border-border p-0.5 '
        )}
        onPress={onCheck}
        hapticType="selection"
      >
        <View
          className={cn(
            'h-full w-full rounded-full',
            internalIsChecked && 'bg-accent-foreground'
          )}
        ></View>
      </HapticPressable>

      <HapticPressable className="flex-1" onPress={onEdit} hapticType="light">
        <View className="flex-row items-center justify-between">
          <View className="relative">
            <Text
              className={cn(
                'text-2xl font-medium text-foreground',
                internalIsChecked && 'text-muted-foreground'
              )}
            >
              {item.name}
            </Text>
            <Animated.View
              style={[
                strikethroughStyle,
                {
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  height: 2,
                  backgroundColor: internalIsChecked
                    ? '#9ca3af'
                    : 'transparent',
                },
              ]}
            />
          </View>
          <Text className="text-lg text-muted-foreground">
            {item.unit === 'each' && 'x'}
            {item.quantity}
            {item.unit !== 'each' && ` ${item.unit}`}
          </Text>
        </View>
        {(item.recipe ?? item.category) && (
          <View className="flex-row items-center justify-between gap-2">
            <View>
              {item.recipe && (
                <View className="flex-row items-center gap-1">
                  <Icon as={CookingPotIcon} size={14} />
                  <Text className="text-sm text-muted-foreground">
                    {item.recipe.name}
                  </Text>
                </View>
              )}
            </View>
            {item.category && <CategoryTag category={item.category} />}
          </View>
        )}
      </HapticPressable>
    </ListItem>
  );
};
