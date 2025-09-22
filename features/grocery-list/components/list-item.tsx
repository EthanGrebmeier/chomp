import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { useCheckGroceryItem } from '../hooks/useCheckGroceryListItem';
import { queryKeys } from '../query-keys';
import { GroceryListItem } from '../types';

type ListItemProps = {
  item: GroceryListItem;
  isChecked: boolean;
};

export const ListItem = ({ item, isChecked }: ListItemProps) => {
  const { mutate: checkItem } = useCheckGroceryItem();
  const queryClient = useQueryClient();
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        className={cn(
          'size-6 overflow-hidden rounded-full border border-gray-300 p-0.5'
        )}
        onPress={() =>
          checkItem(
            { itemId: item.id, isChecked: !isChecked },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.base() });
              },
            }
          )
        }
      >
        <View
          className={cn(
            'h-full w-full rounded-full',
            isChecked && 'bg-gray-500'
          )}
        ></View>
      </Pressable>

      <View className="flex-1 flex-row justify-between">
        <Text className="text-2xl font-medium">{item.name}</Text>
        <Text className="text-lg text-gray-500">x{item.quantity}</Text>
      </View>
    </View>
  );
};
