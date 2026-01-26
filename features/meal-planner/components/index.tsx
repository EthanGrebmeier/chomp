import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
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

  const { datesWithMeals, datesAllMealsAdded } = useMemo(() => {
    const mealStatusByDate = new Map<
      string,
      { hasMeals: boolean; allMealsAdded: boolean }
    >();

    const register = (date: string, addedToList: boolean) => {
      const status = mealStatusByDate.get(date) ?? {
        hasMeals: false,
        allMealsAdded: true,
      };
      status.hasMeals = true;
      if (!addedToList) {
        status.allMealsAdded = false;
      }
      mealStatusByDate.set(date, status);
    };

    recipes.forEach(recipe => register(recipe.date, recipe.addedToList));
    items.forEach(item => register(item.date, item.addedToList));

    const withMeals = new Set<string>();
    const allAdded = new Set<string>();

    mealStatusByDate.forEach((status, date) => {
      if (!status.hasMeals) return;
      withMeals.add(date);
      if (status.allMealsAdded) {
        allAdded.add(date);
      }
    });

    return { datesWithMeals: withMeals, datesAllMealsAdded: allAdded };
  }, [items, recipes]);

  // Track when the date array was generated to detect day changes
  const [dateAnchor, setDateAnchor] = useState(() => startOfDay(new Date()));

  // Generate date range: 30 days before today to 30 days after
  const daysOfPlan = useMemo(() => {
    const dates = [];
    for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
      dates.push(i < 0 ? subDays(dateAnchor, Math.abs(i)) : addDays(dateAnchor, i));
    }
    return dates;
  }, [dateAnchor]);

  // Initial page index is today (middle of the range)
  const initialPageIndex = DAYS_RANGE;

  const [currentPageIndex, setCurrentPageIndex] =
    useState<number>(initialPageIndex);

  // When app becomes active, check if the day has changed and navigate to today
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const realToday = startOfDay(new Date());
        if (!isSameDay(realToday, dateAnchor)) {
          // Day has changed - update the date anchor and navigate to today
          setDateAnchor(realToday);
          isProgrammaticNavigationRef.current = true;
          pagerRef.current?.setPageWithoutAnimation(initialPageIndex);
          setCurrentPageIndex(initialPageIndex);
        }
      }
    });
    return () => subscription.remove();
  }, [dateAnchor, initialPageIndex]);

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
        datesWithMeals={datesWithMeals}
        datesAllMealsAdded={datesAllMealsAdded}
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
