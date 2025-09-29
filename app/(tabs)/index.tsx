import { Heading } from '@/components/text/heading';
import { GroceryListCard } from '@/features/grocery-list/components/grocery-list-card';
import { useGroceryLists } from '@/features/grocery-list/hooks/useGroceryLists';
import { FlatList, View } from 'react-native';
import { AddListSheet } from '../../features/grocery-list/components/add-list-sheet';

export default function Index() {
  const lists = useGroceryLists();

  return (
    <View className="py-safe flex-1 gap-2 bg-background px-4">
      <Heading>Lists</Heading>
      <FlatList
        data={lists.data}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <GroceryListCard key={item.id} groceryList={item} />
        )}
        className="flex-1"
        contentContainerClassName="flex-1"
      />
      <View className="absolute bottom-4 right-4">
        <AddListSheet />
      </View>
    </View>
  );
}
