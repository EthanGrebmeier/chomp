import { Text, View } from 'react-native';
import { GroceryListItem } from '../types';
import { ListItem } from './list-item';

import { format } from 'date-fns';

type GroceryListProps = {
  date: string;
  items: GroceryListItem[];
};

export const GroceryList = ({ date, items }: GroceryListProps) => {
  return (
    <View>
      {/** Header */}
      <View className="mb-8 flex-row items-center justify-between">
        <Text className="text-3xl font-bold">
          {format(date, 'EEEE, M/d/yy')}
        </Text>
        <Text className="text-lg text-gray-500">{items.length} items</Text>
      </View>

      {/** List */}
      <View className="gap-4">
        {items.map((item, i) => (
          <View key={item.id} className="">
            <ListItem key={item.id} item={item} isChecked={false} />
            {i < items.length - 1 && <View className="mt-4 h-px bg-gray-200" />}
          </View>
        ))}
      </View>
    </View>
  );
};
