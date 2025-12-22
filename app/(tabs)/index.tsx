import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '@/features/grocery-lists/components/select-grocery-list-sheet';
import { useCreateGroceryList } from '@/features/grocery-lists/instant/useCreateGroceryList';
import { useDeleteGroceryList } from '@/features/grocery-lists/instant/useDeleteGroceryList';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useLeaveGroceryList } from '@/features/grocery-lists/instant/useLeaveGroceryList';
import { db } from '@/lib/instant';

import { Text } from '../../components/ui/text';
import { useSettings } from '../../features/grocery-list/hooks/useSettings';

export default function List() {
  const { listId: listIdParam } = useLocalSearchParams<{ listId?: string }>();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [activeListId, setActiveListId] = useState<string | undefined>(
    undefined
  );
  const { data: lists, isLoading: listsLoading } = useGroceryLists();
  const { user } = db.useAuth();
  const createGroceryList = useCreateGroceryList();
  const deleteGroceryList = useDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);

  // Set active list from URL param if provided
  useEffect(() => {
    if (listIdParam && lists?.grocery_lists.some(l => l.id === listIdParam)) {
      setActiveListId(listIdParam);
    }
  }, [listIdParam, lists]);

  // Set default list if none selected
  useEffect(() => {
    const setOrCreateDefaultList = async () => {
      if (listsLoading) return;

      if (!activeListId && lists?.grocery_lists.length) {
        setActiveListId(lists.grocery_lists[0].id);
      } else if (!activeListId && !lists?.grocery_lists.length) {
        const { listId } = await createGroceryList('Shopping List');
        setActiveListId(listId);
      }
    };

    setOrCreateDefaultList();
  }, [lists, activeListId, createGroceryList, listsLoading]);

  const activeList = lists?.grocery_lists.find(
    list => list.id === activeListId
  );
  const activeListItems = activeList?.grocery_items ?? [];

  const handleDeleteOrLeave = async () => {
    if (!activeListId || !activeList) return;

    const isOwner = user?.id === activeList.ownerId;

    if (isOwner) {
      await deleteGroceryList(activeListId);
    } else {
      await leaveGroceryList(activeListId);
    }

    // Switch to another list if available
    const remainingLists = lists?.grocery_lists.filter(
      list => list.id !== activeListId
    );
    if (remainingLists && remainingLists.length > 0) {
      setActiveListId(remainingLists[0].id);
    } else {
      setActiveListId(undefined);
    }
  };

  if (listsLoading || settingsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!settings) return null;

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        <GroceryList
          listId={activeListId}
          listName={activeList?.name}
          joinCode={activeList?.joinCode}
          ownerId={activeList?.ownerId}
          items={activeListItems}
          groupBy={settings.groupBy}
          sortBy={settings.sortBy}
          onTitlePress={() => selectListSheetRef.current?.present()}
          onDeleteOrLeave={handleDeleteOrLeave}
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
