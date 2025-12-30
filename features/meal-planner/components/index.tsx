import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { PlusIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useUserMealPlanData } from '../hooks';
import { MealPlanItemWithStore } from '../types';

import {
  AddToMealPlanSheet,
  AddToMealPlanSheetRef,
} from './add-to-meal-plan-sheet';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { EditItemSheet, EditItemSheetRef } from './edit-item-sheet';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { ListSelectorSheet } from './list-selector-sheet';
import { MealPlanDate } from './meal-plan-date';
import { MealPlanDateView } from './meal-plan-date-view';

const DAYS_RANGE = 30; // Show 30 days before and after today

export const MealPlanner = () => {
  const addToMealPlanSheet = useRef<AddToMealPlanSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const editItemSheet = useRef<EditItemSheetRef>(null);
  const pagerRef = useRef<PagerView>(null);
  const isProgrammaticNavigationRef = useRef(false);
  const { recipes, items } = useUserMealPlanData();

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
      isProgrammaticNavigationRef.current = true;
      pagerRef.current?.setPageWithoutAnimation(index);
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

  const handleTodayPress = () => {
    const today = startOfDay(new Date());
    handleDatePress(today);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(140)}
      className="flex-1 "
    >
      <View className="flex-row items-center justify-between px-4">
        <Heading>Meal Plan</Heading>
      </View>
      <ListSelectorSheet />
      <AddToMealPlanSheet ref={addToMealPlanSheet} />
      <EditMealSheet ref={editMealSheet} />
      <EditItemSheet sheetRef={editItemSheet} />
      <MealPlanDate currentDate={currentDate} onTodayPress={handleTodayPress} />
      <MealPlanDateSelector
        dates={daysOfPlan}
        currentDate={currentDate}
        onDatePress={handleDatePress}
        isProgrammaticNavigationRef={isProgrammaticNavigationRef}
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
    </Animated.View>
  );
};
