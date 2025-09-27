import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryLists } from '@/features/grocery-list/hooks/useGroceryLists';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddListSheet } from '../features/grocery-list/components/add-list-sheet';

export default function Index() {
  const { data: groceryLists } = useGroceryLists();
  const insets = useSafeAreaInsets();

  if (!groceryLists) return null;

  const list = groceryLists[0];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {!list && (
        <View className="bg flex-1 items-center justify-center gap-4">
          <Text className="text-2xl font-bold">No lists found</Text>
          <AddListSheet />
        </View>
      )}
      {list && (
        <GroceryList
          date={list.date}
          items={list.items}
          groceryListId={list.id}
        />
      )}
    </View>
  );
}
