import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryList } from '@/features/grocery-list/hooks/useGroceryList';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { BackButton } from '../../../components/ui/back-button';

export default function List() {
  const { listId, autofocus } = useLocalSearchParams<{
    listId: string;
    autofocus?: string;
  }>();

  const { data: list } = useGroceryList(listId!);

  if (!list) return null;

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        <BackButton />
        <GroceryList
          name={list.name}
          date={list.date || ''}
          items={list.items}
          groceryListId={list.id}
          groupBy={list.groupBy}
          autofocus={autofocus === 'true'}
        />
      </View>
    </View>
  );
}
