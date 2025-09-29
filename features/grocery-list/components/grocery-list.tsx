import { Text, View } from 'react-native';
import { GroceryListItem } from '../types';
import { ListItem } from './list-item';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Heading } from '../../../components/text/heading';
import { AddItemSheet } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';

type GroceryListProps = {
  name: string;
  date?: string;
  items: GroceryListItem[];
  groceryListId: string;
};

export const GroceryList = ({
  name,
  date,
  items,
  groceryListId,
}: GroceryListProps) => {
  return (
    <View className="flex-1 gap-4">
      {/** Header */}
      <View className="flex-row items-center justify-between px-4">
        <Heading>{date ? format(date, 'EEEE, M/d/yy') : 'My List'}</Heading>
        <Text className="text-lg text-muted-foreground">
          {items.length} items
        </Text>
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
      <View className="absolute bottom-4 right-4 flex-row gap-2">
        <AddRecipeSheet groceryListId={groceryListId} />
        <AddItemSheet groceryListId={groceryListId} />
      </View>
    </View>
  );
};
