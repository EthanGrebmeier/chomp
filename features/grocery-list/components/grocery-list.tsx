import { ScrollView, Text, View } from 'react-native';
import { GroceryListItem } from '../types';
import { ListItem } from './list-item';

import { format } from 'date-fns';

type GroceryListProps = {
  date: string;
  items: GroceryListItem[];
};

export const GroceryList = ({ date, items }: GroceryListProps) => {
  return (
    <View className="flex-1 gap-4">
      {/** Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-3xl font-bold">
          {format(date, 'EEEE, M/d/yy')}
        </Text>
        <Text className="text-lg text-gray-500">{items.length} items</Text>
      </View>

      {/** List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="py-0"
        contentContainerClassName="gap-1 py-0"
      >
        {items.map((item, i) => (
          <View key={item.id}>
            <View className="py-4">
              <ListItem
                key={item.id}
                item={item}
                isChecked={Boolean(item.isChecked)}
              />
            </View>
            {i < items.length - 1 && <View className="h-px bg-gray-200" />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
