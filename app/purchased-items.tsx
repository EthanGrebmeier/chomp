import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GroceryListHeader } from '@/features/grocery-list/components/grocery-list-header';
import { PurchasedItemsScreen } from '@/features/grocery-list/purchased/purchased-items-screen';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { buildListUrl } from '@/lib/navigation';

export default function PurchasedItemsRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const { data, isLoading, error } = useGroceryLists();
  const list = data?.grocery_lists.find(list => list.id === listId);
  const unavailable = !isLoading && !error && !list;
  const onBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace(buildListUrl({ listId }));
  return (
    <View className="pb-safe pt-safe flex-1 bg-background">
      {listId && !unavailable && !error ? (
        <PurchasedItemsScreen
          key={listId}
          listId={listId}
          listName={list?.name}
          onBack={onBack}
        />
      ) : (
        <>
          <GroceryListHeader listName="Purchased items" onBackPress={onBack} />
          <Text className="px-6 py-12 text-center text-muted-foreground">
            {error
              ? 'Could not load this list. Check your connection.'
              : listId
                ? 'This list is no longer available.'
                : 'Choose a list to view its purchases.'}
          </Text>
        </>
      )}
    </View>
  );
}
