import { SearchIcon } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { useGroceryLists } from '../../grocery-list/hooks/useGroceryLists';

type GroceryListOptionsProps = {
  onSearch: () => void;
  onAddToList: (listId: string) => void;
  isAdding: boolean;
};

export const GroceryListOptions = ({
  onSearch,
  onAddToList,
  isAdding,
}: GroceryListOptionsProps) => {
  const { data: groceryLists, isLoading: isLoadingLists } = useGroceryLists();

  // Sort by date (most recent first) and take only the first 3
  const recentLists =
    groceryLists
      ?.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3) || [];

  if (isLoadingLists) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Loading lists...</Text>
      </View>
    );
  }

  if (recentLists.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-muted-foreground">No existing lists found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="mb-2">
        <BottomSheet.Header
          title="Add to List"
          button={
            <Pressable onPress={onSearch}>
              <SearchIcon size={16} />
            </Pressable>
          }
        />
      </View>

      <FlatList
        scrollEnabled={false}
        data={recentLists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onAddToList(item.id)}
            disabled={isAdding}
            className={`mb-2 rounded-lg border p-4 ${
              isAdding ? 'opacity-50' : 'border-border bg-card'
            }`}
          >
            <Text className="text-lg font-semibold">{item.name}</Text>
            <Text className="text-sm text-muted-foreground">
              {item.items?.length || 0} items
            </Text>
            {item.date && (
              <Text className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString()}
              </Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
};
