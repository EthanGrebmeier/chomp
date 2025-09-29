import { GroceryListCard } from '@/features/grocery-list/components/grocery-list-card';
import { useGroceryLists } from '@/features/grocery-list/hooks/useGroceryLists';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddListSheet } from '../../features/grocery-list/components/add-list-sheet';

export default function Index() {
  const lists = useGroceryLists();

  return (
    <SafeAreaView className="flex-1 gap-2 bg-background px-4">
      <Text className="text-2xl font-bold">Lists</Text>
      <View className="flex-row flex-wrap gap-4">
        {lists.data?.map(list => (
          <GroceryListCard key={list.id} groceryList={list} />
        ))}
      </View>
      <View className="absolute bottom-4 right-4">
        <AddListSheet />
      </View>
    </SafeAreaView>
  );
}
