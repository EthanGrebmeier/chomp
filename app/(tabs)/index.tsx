import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmptyHeading } from '@/components/text/empty-heading';
import { EmptySubtext } from '@/components/text/empty-subtext';
import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { GroceryListSkeleton } from '@/features/grocery-list/components/grocery-list-skeleton';
import { type ListView } from '@/features/grocery-list/components/list-view-tabs';
import { useGroceryListItems } from '@/features/grocery-list/instant/useGroceryListItems';
import { useDeleteGroceryList } from '@/features/grocery-lists/instant/useDeleteGroceryList';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useLeaveGroceryList } from '@/features/grocery-lists/instant/useLeaveGroceryList';
import { useTrackListAccess } from '@/features/grocery-lists/instant/useTrackListAccess';
import { MealPlanner } from '@/features/meal-planner/components';
import { useMealPlanViewMode } from '@/features/meal-planner/hooks/use-meal-plan-view-mode';
import { db } from '@/lib/instant';
import { buildGroceryListsIndexUrl } from '@/lib/navigation';

import { useSettings } from '../../features/grocery-list/hooks/useSettings';

export default function List() {
  const { listId: listIdParam, view: viewParam } = useLocalSearchParams<{
    listId?: string;
    view?: string;
  }>();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [selectedListId, setSelectedListId] = useState<
    string | null | undefined
  >(listIdParam);
  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
  } = useGroceryLists();
  const selectedList =
    selectedListId === null
      ? undefined
      : lists?.grocery_lists.find(list => list.id === selectedListId);
  const parameterList = lists?.grocery_lists.find(
    list => list.id === listIdParam
  );
  const activeListId =
    selectedListId === null
      ? undefined
      : (selectedList?.id ?? parameterList?.id ?? lists?.grocery_lists[0]?.id);
  const [selectedView, setSelectedView] = useState<ListView>('grocery-list');
  const activeView: ListView =
    selectedView === 'meal-plan' && !activeListId && !listsLoading
      ? 'grocery-list'
      : selectedView;
  const { user } = db.useAuth();
  const { viewMode: mealPlanViewMode, setViewMode: setMealPlanViewMode } =
    useMealPlanViewMode(user?.id);
  const deleteGroceryList = useDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();
  const trackListAccess = useTrackListAccess();

  const handleActiveListChange = useCallback(
    (nextListId?: string) => {
      if (nextListId === activeListId) {
        return;
      }

      setSelectedListId(nextListId ?? null);
      router.setParams({ listId: nextListId });
    },
    [activeListId]
  );

  useEffect(() => {
    if (activeListId) {
      trackListAccess(activeListId);
    }
  }, [activeListId, trackListAccess]);

  useEffect(() => {
    if (viewParam === 'meal-plan' && !activeListId && !listsLoading) {
      router.setParams({ view: undefined });
    }
  }, [activeListId, listsLoading, viewParam]);

  const activeList = lists?.grocery_lists.find(
    list => list.id === activeListId
  );
  const { items: activeListItems, isLoading: itemsLoading } =
    useGroceryListItems(activeListId);

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

  // Items load per list; keep <GroceryList> mounted across list switches and
  // let it render a quiet list area instead of tearing down to the skeleton.
  const isLoading = listsLoading || settingsLoading;

  const handleViewChange = useCallback(
    (nextView: ListView) => {
      if (nextView === 'meal-plan' && !activeListId) {
        return;
      }

      setSelectedView(nextView);
      router.setParams({
        view: nextView === 'meal-plan' ? 'meal-plan' : undefined,
      });
    },
    [activeListId]
  );

  const handleOpenListsIndex = useCallback(() => {
    router.dismissTo(
      buildGroceryListsIndexUrl({
        selectedListId: activeListId,
      })
    );
  }, [activeListId]);

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        {listsError ? (
          <View
            accessibilityRole="alert"
            className="flex-1 items-center justify-center gap-1 px-6"
          >
            <EmptyHeading>Couldn&apos;t load your grocery lists</EmptyHeading>
            <EmptySubtext>Check your connection, then try again.</EmptySubtext>
          </View>
        ) : isLoading ? (
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
              items={activeListItems}
              isItemsLoading={itemsLoading}
              groupBy={settings.groupBy}
              sortBy={settings.sortBy}
              onBackPress={handleOpenListsIndex}
              onDeleteOrLeave={handleDeleteOrLeave}
              onActiveListChange={listId => handleActiveListChange(listId)}
              activeListChangeVersion={activeListId}
              activeView={activeView}
              onViewChange={handleViewChange}
              mealPlanViewMode={mealPlanViewMode}
              onMealPlanViewModeChange={setMealPlanViewMode}
              alternateContent={
                activeListId ? (
                  <MealPlanner
                    listId={activeListId}
                    showHeader={false}
                    onViewChange={handleViewChange}
                    viewMode={mealPlanViewMode}
                    onViewModeChange={setMealPlanViewMode}
                  />
                ) : null
              }
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
