import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryList } from '@/features/grocery-list/hooks/useGroceryList';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AddListSheet } from '../features/grocery-list/components/add-list-sheet';

export default function List() {
  const insets = useSafeAreaInsets();
  const { listId } = useLocalSearchParams<{ listId: string }>();

  const { data: list } = useGroceryList(listId);

  if (!list) return null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Pressable
        onPress={() => router.back()}
        className="mb-4 flex-row items-center gap-2 px-4"
      >
        <ArrowLeftIcon size={16} color="black" />
        <Text className="text-sm font-medium">My Lists</Text>
      </Pressable>
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
    </SafeAreaView>
  );
}
