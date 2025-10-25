import { Heading } from '@/components/text/heading';
import { GroceryListCard } from '@/features/grocery-list/components/grocery-list-card';
import { useGroceryLists } from '@/features/grocery-list/hooks/useGroceryLists';
import { isBefore } from 'date-fns';
import { FlatList, View } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { Text } from '../../../components/ui/text';
import { AddListSheet } from '../../../features/grocery-list/components/add-list-sheet';
export default function Index() {
  const lists = useGroceryLists();

  const listsChronological = lists.data?.sort((a, b) => {
    return isBefore(b.createdAt, a.createdAt) ? -1 : 1;
  });

  return (
    <View className="pt-safe flex-1  bg-background ">
      <View className="px-4">
        <Heading>Lists</Heading>
      </View>
      {!lists.isLoading && lists.data && lists.data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No lists yet</Text>
        </View>
      ) : (
        <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
          <FlatList
            data={listsChronological}
            renderItem={({ item, index }) => (
              <GroceryListCard
                key={item.id}
                groceryList={item}
                className={
                  index !== (lists.data?.length ?? 0) - 1
                    ? 'border-b border-border'
                    : ''
                }
              />
            )}
            className="flex-1"
            contentContainerClassName="flex-1"
          />
        </LayoutAnimationConfig>
      )}
      <View className="absolute bottom-4 right-4">
        <AddListSheet />
      </View>
    </View>
  );
}
