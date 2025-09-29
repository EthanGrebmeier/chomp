import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryList } from '@/features/grocery-list/hooks/useGroceryList';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/icon';

export default function List() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  const { data: list } = useGroceryList(listId);

  if (!list) return null;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 ">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 flex-row items-center gap-2 px-4"
        >
          <Icon as={ArrowLeftIcon} size={16} />
          <Text className="text-sm font-medium text-foreground">My Lists</Text>
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
