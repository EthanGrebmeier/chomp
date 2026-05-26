import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { GroceryListSkeleton } from '@/features/grocery-list/components/grocery-list-skeleton';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '@/features/grocery-lists/components/select-grocery-list-sheet';
import { useDeleteGroceryList } from '@/features/grocery-lists/instant/useDeleteGroceryList';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useLeaveGroceryList } from '@/features/grocery-lists/instant/useLeaveGroceryList';
import { useTrackListAccess } from '@/features/grocery-lists/instant/useTrackListAccess';
import { db } from '@/lib/instant';

import { useSettings } from '../../features/grocery-list/hooks/useSettings';

export default function List() {
  const { listId: listIdParam } = useLocalSearchParams<{ listId?: string }>();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [activeListId, setActiveListId] = useState<string | undefined>(
    undefined
  );
  const [activeListChangeVersion, setActiveListChangeVersion] = useState(0);
  const { data: lists, isLoading: listsLoading } = useGroceryLists();
  const { user } = db.useAuth();
  const deleteGroceryList = useDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();
  const trackListAccess = useTrackListAccess();
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);

  const handleActiveListChange = useCallback(
    (nextListId?: string) => {
      if (nextListId === activeListId) {
        return;
      }

      setActiveListId(nextListId);
      setActiveListChangeVersion(version => version + 1);

      if (nextListId) {
        trackListAccess(nextListId);
      }
    },
    [activeListId, trackListAccess]
  );

  // Set active list from URL param if provided
  useEffect(() => {
    if (listIdParam && lists?.grocery_lists.some(l => l.id === listIdParam)) {
      handleActiveListChange(listIdParam);
    }
  }, [handleActiveListChange, listIdParam, lists]);

  // Set default list if none selected or selection is stale
  useEffect(() => {
    const setOrCreateDefaultList = async () => {
      if (listsLoading) return;

      const activeListStillExists = Boolean(
        activeListId && lists?.grocery_lists.some(l => l.id === activeListId)
      );

      if (
        lists?.grocery_lists.length &&
        (!activeListId || !activeListStillExists)
      ) {
        const defaultListId = lists.grocery_lists[0].id;
        handleActiveListChange(defaultListId);
        return;
      }

      if (!lists?.grocery_lists.length) {
        handleActiveListChange(undefined);
      }
    };

    setOrCreateDefaultList();
  }, [
    activeListId,
    handleActiveListChange,
    lists,
    listsLoading,
  ]);

  const activeList = lists?.grocery_lists.find(
    list => list.id === activeListId
  );
  const activeListItems = activeList?.grocery_items ?? [];
  const isActiveListShared = (activeList?.shares?.length ?? 0) > 1;

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
      handleActiveListChange(remainingLists[0].id);
    } else {
      handleActiveListChange(undefined);
    }
  };

  const isLoading = listsLoading || settingsLoading;

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <GroceryListSkeleton />
          </Animated.View>
        ) : settings ? (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <GroceryList
              listId={activeListId}
              listName={activeList?.name}
              joinCode={activeList?.joinCode}
              ownerId={activeList?.ownerId}
              isShared={isActiveListShared}
              items={activeListItems}
              groupBy={settings.groupBy}
              sortBy={settings.sortBy}
              onViewListsPress={() => selectListSheetRef.current?.present()}
              onDeleteOrLeave={handleDeleteOrLeave}
              onActiveListChange={listId => handleActiveListChange(listId)}
              activeListChangeVersion={activeListChangeVersion}
            />
          </Animated.View>
        ) : null}
      </View>
      <SelectGroceryListSheet
        ref={selectListSheetRef}
        selectedListId={activeListId}
        onSelectList={handleActiveListChange}
      />
    </View>
  );
}
