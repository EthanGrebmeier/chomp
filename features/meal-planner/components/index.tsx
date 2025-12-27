import { eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { PlusIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { useUpdateMealPlan } from '../hooks/useUpdateMealPlan';
import { MealPlanItemWithStore, MealPlanWithRecipesAndItems } from '../types';

import {
  AddToMealPlanSheet,
  AddToMealPlanSheetRef,
} from './add-to-meal-plan-sheet';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { EditItemSheet, EditItemSheetRef } from './edit-item-sheet';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { MealPlanDateView } from './meal-plan-date-view';
import { MealPlanDropdownMenu } from './meal-plan-dropdown-menu';

type MealPlannerProps = {
  mealPlan: MealPlanWithRecipesAndItems;
};

export const MealPlanner = ({ mealPlan }: MealPlannerProps) => {
  const addToMealPlanSheet = useRef<AddToMealPlanSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const editItemSheet = useRef<EditItemSheetRef>(null);
  const startDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const endDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const { mutate: updateMealPlan } = useUpdateMealPlan();
  const daysOfPlan = eachDayOfInterval({
    start: new Date(mealPlan.startDate),
    end: new Date(mealPlan.endDate),
  });

  // Calculate initial page index to be today if it falls within the meal plan
  const initialPageIndex = useMemo(() => {
    const today = startOfDay(new Date());
    const todayIndex = daysOfPlan.findIndex(date => isSameDay(date, today));
    return todayIndex !== -1 ? todayIndex : 0;
  }, [daysOfPlan]);

  const [currentPageIndex, setCurrentPageIndex] =
    useState<number>(initialPageIndex);

  const currentDate = daysOfPlan[currentPageIndex] || daysOfPlan[0];

  const getRecipesForDate = (date: Date) => {
    if (!mealPlan) return [];
    return (mealPlan.meal_plan_recipes || []).filter(
      recipe => recipe.date === format(date, 'yyyy-MM-dd')
    );
  };

  const getItemsForDate = (date: Date): MealPlanItemWithStore[] => {
    if (!mealPlan) return [];
    return (mealPlan.meal_plan_items || []).filter(
      item => item.date === format(date, 'yyyy-MM-dd')
    );
  };

  const handleChangeStartDate = (date: Date) => {
    updateMealPlan({
      mealPlanId: mealPlan.id,
      updates: {
        startDate: format(date, 'yyyy-MM-dd') + 'T00:00:00',
      },
    });
  };
  const handleChangeEndDate = (date: Date) => {
    updateMealPlan({
      mealPlanId: mealPlan.id,
      updates: {
        endDate: format(date, 'yyyy-MM-dd') + 'T00:00:00',
      },
    });
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

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(140)}
      className="flex-1 "
    >
      <View className="px-4">
        <View className="flex-row items-center justify-between">
          <Heading>Meal Plan</Heading>
          <MealPlanDropdownMenu
            mealPlanId={mealPlan.id}
            mealPlanName={'Meal Plan'}
          />
        </View>
        {mealPlan?.startDate && mealPlan?.endDate && (
          <View className="flex-row items-center gap-1">
            <Pressable onPress={() => startDateSheetRef.current?.present()}>
              <Text className="text-lg font-semibold text-muted-foreground">
                {format(new Date(mealPlan.startDate), 'EE, M/d/yy')}
              </Text>
            </Pressable>
            <Text className="text-lg text-muted-foreground">-</Text>
            <Pressable onPress={() => endDateSheetRef.current?.present()}>
              <Text className="text-lg font-semibold text-muted-foreground">
                {format(new Date(mealPlan.endDate), 'EE, M/d/yy')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      <CalendarSheet
        name="meal-planner-start-date-sheet"
        onChange={handleChangeStartDate}
        ref={startDateSheetRef}
        headerTitle="Select Start Date"
        selectedDate={new Date(mealPlan.startDate)}
        validEndDate={new Date(mealPlan.endDate)}
      />
      <CalendarSheet
        name="meal-planner-end-date-sheet"
        onChange={handleChangeEndDate}
        ref={endDateSheetRef}
        headerTitle="Select End Date"
        selectedDate={new Date(mealPlan.endDate)}
        validStartDate={new Date(mealPlan.startDate)}
      />
      <AddToMealPlanSheet ref={addToMealPlanSheet} mealPlanId={mealPlan.id} />
      <EditMealSheet
        ref={editMealSheet}
        startDate={mealPlan.startDate}
        endDate={mealPlan.endDate}
      />
      <EditItemSheet
        sheetRef={editItemSheet}
        startDate={mealPlan.startDate}
        endDate={mealPlan.endDate}
      />
      <MealPlanDateSelector
        dates={daysOfPlan}
        currentDate={currentDate}
        onDatePress={handleDatePress}
      />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={currentPageIndex}
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
