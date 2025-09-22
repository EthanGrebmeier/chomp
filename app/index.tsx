import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryLists } from '@/features/grocery-list/hooks/useGroceryLists';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddItemSheet } from '../features/grocery-list/components/add-item-sheet';

export default function Index() {
  const { data: groceryLists } = useGroceryLists();
  const insets = useSafeAreaInsets();

  if (!groceryLists) return null;

  const list = groceryLists[0];

  return (
    <View className="flex-1 " style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-4">
        {list && <GroceryList date={list.date} items={list.items} />}
      </View>
      <View className="absolute bottom-4 right-4">
        {list && <AddItemSheet groceryListId={list.id} />}
      </View>
    </View>
  );
}
