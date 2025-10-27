import { useQueryClient } from '@tanstack/react-query';
import { CookingPotIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { CategoryTag } from '../../../components/category-tag';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useCheckGroceryItem } from '../hooks/useCheckGroceryListItem';
import { useRemoveGroceryListItem } from '../hooks/useRemoveGroceryListItem';
import { queryKeys } from '../query-keys';
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
  const { mutate: checkItem } = useCheckGroceryItem();
  const queryClient = useQueryClient();
  const { mutate: removeItem } = useRemoveGroceryListItem();
  return (
    <ListItem
      onDelete={() =>
        removeItem({ itemId: item.id, groceryListId: item.groceryListId })
      }
      className={className}
    >
      <HapticPressable
        hitSlop={10}
        className={cn(
          'size-6 overflow-hidden rounded-full border border-border p-0.5 '
        )}
        onPress={() =>
          checkItem(
            { itemId: item.id, isChecked: !isChecked },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.base(),
                });
              },
            }
          )
        }
        hapticType="selection"
      >
        <View
          className={cn(
            'h-full w-full rounded-full',
            isChecked && 'bg-primary'
          )}
        ></View>
      </HapticPressable>

      <HapticPressable className="flex-1" onPress={onEdit} hapticType="light">
        <View className="flex-row items-center justify-between">
          <Text
            className={cn(
              'text-2xl font-medium text-foreground',
              isChecked && 'text-muted-foreground'
            )}
          >
            {item.name}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {item.unit === 'each' && 'x'}
            {item.quantity}
            {item.unit !== 'each' && ` ${item.unit}`}
          </Text>
        </View>
        {(item.recipe || item.category) && (
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
