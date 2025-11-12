import { eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Text } from '../../../components/ui/text';
import { useUpdateMealPlan } from '../hooks/useUpdateMealPlan';
import { MealPlanDay, MealPlanWithRecipes } from '../types';

import { AddMealSheet, AddMealSheetRef } from './add-meal-sheet';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { MealPlanDateView } from './meal-plan-date-view';
import { MealPlanDropdownMenu } from './meal-plan-dropdown-menu';

type MealPlannerProps = {
  mealPlan: MealPlanWithRecipes;
};

export const MealPlanner = ({ mealPlan }: MealPlannerProps) => {
  const addMealSheet = useRef<AddMealSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
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

  const getRecipesForDate = (date: Date): MealPlanDay['recipes'] => {
    if (!mealPlan) return [];
    return mealPlan.recipes.filter(
      recipe => recipe.date === format(date, 'yyyy-MM-dd')
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

  return (
    <View className="flex-1 ">
      <View className="px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-4xl font-bold text-foreground">
            {mealPlan?.name ?? 'Meal Plan'}
          </Text>
          <MealPlanDropdownMenu
            mealPlanId={mealPlan.id}
            mealPlanName={'Meal Plan'}
          />
        </View>
        {mealPlan?.startDate && mealPlan?.endDate && (
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={() =>
                startDateSheetRef.current?.present({
                  selectedDate: new Date(mealPlan.startDate),
                  validEndDate: new Date(mealPlan.endDate),
                })
              }
            >
              <Text className="text-lg font-semibold text-muted-foreground">
                {format(new Date(mealPlan.startDate), 'EE, M/d/yy')}
              </Text>
            </Pressable>
            <Text className="text-lg text-muted-foreground">-</Text>
            <Pressable
              onPress={() =>
                endDateSheetRef.current?.present({
                  selectedDate: new Date(mealPlan.endDate),
                  validStartDate: new Date(mealPlan.startDate),
                })
              }
            >
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
      />
      <CalendarSheet
        name="meal-planner-end-date-sheet"
        onChange={handleChangeEndDate}
        ref={endDateSheetRef}
        headerTitle="Select End Date"
      />
      <AddMealSheet ref={addMealSheet} mealPlanId={mealPlan.id} />
      <EditMealSheet
        ref={editMealSheet}
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
            <Text className="mb-2 px-4 text-2xl font-semibold text-foreground">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </Text>
            <MealPlanDateView
              recipes={getRecipesForDate(date)}
              date={format(date, 'yyyy-MM-dd')}
              onMealPress={({ mealPlanRecipe, recipe }) =>
                editMealSheet.current?.open({ mealPlanRecipe, recipe })
              }
              onAddMealPress={({ date: mealDate, mealTime }) =>
                addMealSheet.current?.open({ date: mealDate, mealTime })
              }
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
};
