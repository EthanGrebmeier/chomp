import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import { db } from '../../../lib/instant';
import { useClearMealPlan, useUserMealPlanData } from '../hooks';
import { MealPlanItemWithStore } from '../types';

import {
  AddToMealPlanSheet,
  AddToMealPlanSheetRef,
} from './add-to-meal-plan-sheet';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { EditItemSheet, EditItemSheetRef } from './edit-item-sheet';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { ListSelectorSheet, ListSelectorSheetRef } from './list-selector-sheet';
import { MealPlanDate } from './meal-plan-date';
import { MealPlanDateView } from './meal-plan-date-view';

const DAYS_RANGE = 30; //  days before and after today

type MealPlannerProps = {
  listId: string;
};

export const MealPlanner = ({ listId }: MealPlannerProps) => {
  const addToMealPlanSheet = useRef<AddToMealPlanSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const editItemSheet = useRef<EditItemSheetRef>(null);
  const listSelectorSheet = useRef<ListSelectorSheetRef>(null);
  const pagerRef = useRef<PagerView>(null);
  const isProgrammaticNavigationRef = useRef(false);
  const shouldReturnToListSelectorRef = useRef(false);
  const { recipes, items } = useUserMealPlanData(listId);
  const { mutate: clearMealPlan } = useClearMealPlan();
  const hasMealPlanEntries = recipes.length > 0 || items.length > 0;

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
      dates.push(
        i < 0 ? subDays(dateAnchor, Math.abs(i)) : addDays(dateAnchor, i)
      );
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

  const handleDatePress = useCallback(
    (date: Date) => {
      const index = daysOfPlan.findIndex(d => isSameDay(d, date));
      if (index !== -1) {
        isProgrammaticNavigationRef.current = true;
        pagerRef.current?.setPageWithoutAnimation(index);
        setCurrentPageIndex(index);
      }
    },
    [daysOfPlan]
  );

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPageIndex(e.nativeEvent.position);
  };

  const handleItemPress = (item: MealPlanItemWithStore) => {
    editItemSheet.current?.open(item);
  };

  const handleEditMealSheetDismiss = useCallback(() => {
    if (!shouldReturnToListSelectorRef.current) return;
    shouldReturnToListSelectorRef.current = false;
    listSelectorSheet.current?.open();
  }, []);

  const handleAddPress = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    addToMealPlanSheet.current?.present({ defaultDate: dateStr });
  };

  const handleTodayPress = () => {
    const today = startOfDay(new Date());
    handleDatePress(today);
  };

  const handleClearMealPlan = () => {
    if (!hasMealPlanEntries) return;

    Alert.alert(
      'Clear Meal Plan',
      'Are you sure you want to remove all meals and items from your meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () =>
            clearMealPlan({
              mealPlanRecipeIds: recipes.map(recipe => recipe.id),
              mealPlanItemIds: items.map(item => item.id),
            }),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-row items-center px-4">
        <View className="h-10 flex-1 justify-center">
          <Heading>Meal Plan</Heading>
        </View>
        <View className="flex-row items-center gap-1">
          <DropdownMenuRoot
            trigger={
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Icon as={MoreHorizontalIcon} size={20} />
              </Button>
            }
          >
            <DropdownMenuContent>
              <DropdownMenuItem
                key="clear-meal-plan"
                destructive
                onSelect={handleClearMealPlan}
                disabled={!hasMealPlanEntries}
              >
                <DropdownMenuItemTitle>Clear Meal Plan</DropdownMenuItemTitle>
                <DropdownMenuItemIcon ios={{ name: 'xmark.circle' }} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </View>
      </View>
      <ListSelectorSheet
        ref={listSelectorSheet}
        listId={listId}
        onEditMeal={({ mealPlanRecipe, recipe }) => {
          shouldReturnToListSelectorRef.current = true;
          editMealSheet.current?.open({
            mealPlanRecipe,
            recipe,
            onDismiss: handleEditMealSheetDismiss,
          });
        }}
      />
      <AddToMealPlanSheet listId={listId} ref={addToMealPlanSheet} />
      <EditMealSheet ref={editMealSheet} />
      <EditItemSheet ref={editItemSheet} />
      <View className="flex-1">
        <MealPlanDate
          currentDate={currentDate}
          onTodayPress={handleTodayPress}
        />
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
                listId={listId}
                recipes={getRecipesForDate(date)}
                items={getItemsForDate(date)}
                onMealPress={({ mealPlanRecipe, recipe }) => {
                  shouldReturnToListSelectorRef.current = false;
                  editMealSheet.current?.open({ mealPlanRecipe, recipe });
                }}
                onItemPress={handleItemPress}
              />
            </View>
          ))}
        </PagerView>
      </View>
      <Button
        size="wide-small"
        onPress={handleAddPress}
        className="absolute bottom-12 right-6 z-10"
      >
        <Icon
          as={PlusIcon}
          size={28}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
    </View>
  );
};
