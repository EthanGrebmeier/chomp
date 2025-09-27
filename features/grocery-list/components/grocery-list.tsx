import { Text, View } from 'react-native';
import { GroceryListItem } from '../types';
import { ListItem } from './list-item';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Animated, { LinearTransition } from 'react-native-reanimated';

type GroceryListProps = {
  date: string;
  items: GroceryListItem[];
};

export const GroceryList = ({ date, items }: GroceryListProps) => {
  return (
    <View className="flex-1 gap-4">
      {/** Header */}
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-3xl font-bold">
          {format(date, 'EEEE, M/d/yy')}
        </Text>
        <Text className="text-lg text-gray-500">{items.length} items</Text>
      </View>
      <Animated.FlatList
        className="flex-1"
        scrollEnabled
        itemLayoutAnimation={LinearTransition}
        showsVerticalScrollIndicator={false}
        data={items}
        renderItem={({ item, index }) => (
          <ListItem
            key={item.id}
            item={item}
            isChecked={Boolean(item.isChecked)}
            className={cn(
              index < items.length - 1 && 'border-b border-gray-200'
            )}
          />
        )}
      />
    </View>
  );
};
