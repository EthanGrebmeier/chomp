import { Text, View } from 'react-native';

import { GroceryListItem as GroceryListItemType } from '../types';

import { format } from 'date-fns';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Heading } from '../../../components/text/heading';
import { cn } from '../../../lib/utils';
import { AddItemSheet } from './add-item-sheet';
import { AddRecipeSheet } from './add-recipe-sheet';
import { GroceryListItem } from './grocery-list-item';

type GroceryListProps = {
  name: string;
  date?: string;
  items: GroceryListItemType[];
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
          <GroceryListItem
            key={item.id}
            item={item}
            isChecked={Boolean(item.isChecked)}
            className={cn(index < items.length - 1 && 'border-b border-border')}
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
