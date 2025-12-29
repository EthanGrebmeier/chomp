import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { PlusIcon, ShoppingCartIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';
import { MealPlanItemWithStore } from '../types';

import {
  AddToMealPlanSheet,
  AddToMealPlanSheetRef,
} from './add-to-meal-plan-sheet';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { EditItemSheet, EditItemSheetRef } from './edit-item-sheet';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { MealPlanDateView } from './meal-plan-date-view';

const DAYS_RANGE = 30; // Show 30 days before and after today

export const MealPlanner = () => {
  const addToMealPlanSheet = useRef<AddToMealPlanSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const editItemSheet = useRef<EditItemSheetRef>(null);
  const addToListSheetRef = useRef<TrueSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const { recipes, items } = useUserMealPlanData();
  const { data: lists } = useGroceryLists();
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();

  // Generate date range: 30 days before today to 30 days after
  const daysOfPlan = useMemo(() => {
    const today = startOfDay(new Date());
    const dates = [];
    for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
      dates.push(i < 0 ? subDays(today, Math.abs(i)) : addDays(today, i));
    }
    return dates;
  }, []);

  // Initial page index is today (middle of the range)
  const initialPageIndex = DAYS_RANGE;

  const [currentPageIndex, setCurrentPageIndex] =
    useState<number>(initialPageIndex);

  const currentDate =
    daysOfPlan[currentPageIndex] ?? daysOfPlan[initialPageIndex];

  const getRecipesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return recipes.filter(recipe => recipe.date === dateStr);
  };

  const getItemsForDate = (date: Date): MealPlanItemWithStore[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return items.filter(item => item.date === dateStr);
  };

  const handleDatePress = (date: Date) => {
    const index = daysOfPlan.findIndex(d => isSameDay(d, date));
    if (index !== -1) {
      pagerRef.current?.setPage(index);
      setCurrentPageIndex(index);
    }
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPageIndex(e.nativeEvent.position);
  };

  const handleItemPress = (item: MealPlanItemWithStore) => {
    editItemSheet.current?.open(item);
  };

  const handleAddPress = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    addToMealPlanSheet.current?.present({ defaultDate: dateStr });
  };

  const handleAddToList = (listId: string) => {
    addMealsToGroceryList(
      { listId },
      {
        onSuccess: result => {
          const totalAdded = result.addedRecipes + result.addedItems;
          if (totalAdded === 0) {
            toast.info('No new meals to add - all meals already added to list');
          } else {
            toast.success(
              `Added ${totalAdded} item${totalAdded > 1 ? 's' : ''} to list`
            );
          }
          addToListSheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  const unaddedCount = useMemo(() => {
    const unaddedRecipes = recipes.filter(r => !r.addedToList).length;
    const unaddedItems = items.filter(i => !i.addedToList).length;
    return unaddedRecipes + unaddedItems;
  }, [recipes, items]);

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(140)}
      className="flex-1 "
    >
      <View className="flex-row items-center justify-between px-4">
        <Heading>Meal Plan</Heading>
      </View>
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={addToListSheetRef}
        detents={['auto']}
      >
        <BottomSheet.Header
          className="px-4"
          title="Add Meal Plan Items to List"
        />
        <ScrollView className="max-h-80 px-4 pb-4">
          {lists?.grocery_lists.map(list => (
            <Pressable
              key={list.id}
              onPress={() => handleAddToList(list.id)}
              disabled={isAddingToList}
              className={cn(
                'mb-2 rounded-xl px-4 py-3',
                isAddingToList ? 'bg-muted/50' : 'bg-muted active:bg-muted/80'
              )}
            >
              <Text className="text-lg">{list.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {list.grocery_items?.filter(i => !i.isDeleted).length || 0}{' '}
                items
              </Text>
            </Pressable>
          ))}
          {(!lists?.grocery_lists || lists.grocery_lists.length === 0) && (
            <Text className="text-center text-muted-foreground">
              No lists available
            </Text>
          )}
        </ScrollView>
      </BottomSheet>
      <AddToMealPlanSheet ref={addToMealPlanSheet} />
      <EditMealSheet ref={editMealSheet} />
      <EditItemSheet sheetRef={editItemSheet} />
      <MealPlanDateSelector
        dates={daysOfPlan}
        currentDate={currentDate}
        onDatePress={handleDatePress}
      />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialPageIndex}
        onPageSelected={handlePageSelected}
      >
        {daysOfPlan.map(date => (
          <View key={date.toISOString()} style={{ flex: 1 }}>
            <MealPlanDateView
              recipes={getRecipesForDate(date)}
              items={getItemsForDate(date)}
              onMealPress={({ mealPlanRecipe, recipe }) =>
                editMealSheet.current?.open({ mealPlanRecipe, recipe })
              }
              onItemPress={handleItemPress}
            />
          </View>
        ))}
      </PagerView>
      <Button
        size="iconLg"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={handleAddPress}
        className="absolute right-6 z-10"
      >
        <Icon
          as={PlusIcon}
          size={28}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
      {unaddedCount > 0 && (
        <Button
          size="iconLg"
          variant="secondary"
          className="absolute left-6 z-10"
          style={{ bottom: NATIVE_TABS_OFFSET }}
          onPress={() => addToListSheetRef.current?.present()}
          disabled={isAddingToList}
        >
          <Icon
            as={ShoppingCartIcon}
            size={20}
            strokeWidth={3}
            className="text-secondary-foreground"
          />
          {unaddedCount > 0 && (
            <View className="absolute -right-3 -top-3 ml-1 rounded-full bg-primary px-2 ">
              <Text className="text-base font-semibold text-primary-foreground">
                {unaddedCount}
              </Text>
            </View>
          )}
        </Button>
      )}
    </Animated.View>
  );
};
