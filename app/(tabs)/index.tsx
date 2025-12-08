import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryItems, useSettings } from '@/features/grocery-list/hooks';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '@/features/grocery-lists/components/select-grocery-list-sheet';
import { useCreateGroceryList } from '@/features/grocery-lists/instant/useCreateGroceryList';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';

import { Text } from '../../components/ui/text';

export default function List() {
  const { data: items } = useGroceryItems();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const { data: lists, isLoading: listsLoading } = useGroceryLists();
  const createGroceryList = useCreateGroceryList();
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);

  useEffect(() => {
    const setDefaultList = async () => {
      if (lists && !activeListId) {
        if (lists.grocery_lists.length > 0) {
          setActiveListId(lists.grocery_lists[0].id);
        } else {
          const list = await createGroceryList('My List');
          setActiveListId(list.clientId);
        }
      }
    };

    setDefaultList();
  }, [lists, activeListId, createGroceryList]);

  const activeListName = lists?.grocery_lists.find(
    list => list.id === activeListId
  )?.name;

  if (listsLoading || settingsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!items || !settings || !activeListId) return null;

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        <GroceryList
          listId={activeListId}
          listName={activeListName}
          items={items}
          groupBy={settings.groupBy}
          sortBy={settings.sortBy}
          onTitlePress={() => selectListSheetRef.current?.present()}
        />
      </View>
      <SelectGroceryListSheet
        ref={selectListSheetRef}
        selectedListId={activeListId}
        onSelectList={setActiveListId}
      />
    </View>
  );
}
