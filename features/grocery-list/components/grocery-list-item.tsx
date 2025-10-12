import { useQueryClient } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useCheckGroceryItem } from '../hooks/useCheckGroceryListItem';
import { useRemoveGroceryListItem } from '../hooks/useRemoveGroceryListItem';
import { queryKeys } from '../query-keys';
import { GroceryListItem as GroceryListItemType } from '../types';

type GroceryListItemProps = {
  item: GroceryListItemType;
  isChecked: boolean;
  className?: string;
};

export const GroceryListItem = ({
  item,
  isChecked,
  className,
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
      <Pressable
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
      >
        <View
          className={cn(
            'h-full w-full rounded-full',
            isChecked && 'bg-orange-600'
          )}
        ></View>
      </Pressable>

      <View className="flex-1 flex-row justify-between">
        <Text className="text-2xl font-medium text-foreground">
          {item.name}
        </Text>
        <Text className="text-lg text-muted-foreground">x{item.quantity}</Text>
      </View>
    </ListItem>
  );
};
