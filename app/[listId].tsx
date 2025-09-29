import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryList } from '@/features/grocery-list/hooks/useGroceryList';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function List() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  const { data: list } = useGroceryList(listId);

  console.log(list);

  if (!list) return null;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 ">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 flex-row items-center gap-2 px-4"
        >
          <ArrowLeftIcon size={16} color="black" />
          <Text className="text-sm font-medium">My Lists</Text>
        </Pressable>
        <GroceryList
          date={list.date}
          items={list.items}
          groceryListId={list.id}
        />
      </SafeAreaView>
    </View>
  );
}
