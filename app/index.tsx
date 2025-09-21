import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryList } from '@/features/grocery-list/hooks/useGroceryList';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { data: groceryList } = useGroceryList();
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-4">
        <View className="h-12"></View>
        {groceryList && (
          <GroceryList date={groceryList.date} items={groceryList.items} />
        )}
      </View>
    </SafeAreaView>
  );
}
