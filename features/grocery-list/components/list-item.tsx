import { cn } from '@/utils/cn';
import { Pressable, Text, View } from 'react-native';
import { GroceryListItem } from '../types';

type ListItemProps = {
  item: GroceryListItem;
  isChecked: boolean;
};

export const ListItem = ({ item, isChecked }: ListItemProps) => {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        className={cn(
          'size-8 overflow-hidden rounded-full border border-gray-300',
          isChecked && 'bg-green-500'
        )}
      ></Pressable>

      <View className="flex-1 flex-row justify-between">
        <Text className="text-2xl font-medium">{item.name}</Text>
        <Text className="text-lg text-gray-500">x{item.quantity}</Text>
      </View>
    </View>
  );
};
