import { format, isSameDay, startOfDay } from 'date-fns';
import { PlusIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { useUpdateMealPlanItem } from '../hooks/useUpdateMealPlanItem';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import { MealPlanFocusRequest, MealPlanItemWithStore } from '../types';
import {
  buildMealPlanDayListSections,
  MEAL_PLAN_DAY_LIST_PAST_DAYS,
  type MoveMealPlanEntry,
} from '../utils/meal-plan-day-list';

import {
  AddToMealPlanSheet,
  AddToMealPlanSheetRef,
} from './add-to-meal-plan-sheet';
import { EditItemSheet, EditItemSheetRef } from './edit-item-sheet';
import { EditMealSheet, EditMealSheetRef } from './edit-meal-sheet';
import { MealPlanDateView } from './meal-plan-date-view';
import { MealPlanDropdownMenu } from './meal-plan-dropdown-menu';

type MealPlannerProps = {
  listId: string;
  listName?: string;
  onViewListsPress?: () => void;
  showHeader?: boolean;
  isActive?: boolean;
  /** Scrolls the requested day into view. */
  focusRequest?: MealPlanFocusRequest | null;
};

export const MealPlanner = memo(function MealPlanner({
  listId,
  listName,
  onViewListsPress,
  showHeader = true,
  isActive = true,
  focusRequest,
}: MealPlannerProps) {
  const [hasBeenActive, setHasBeenActive] = useState(isActive);
  if (isActive && !hasBeenActive) setHasBeenActive(true);
  const addToMealPlanSheet = useRef<AddToMealPlanSheetRef>(null);
  const editMealSheet = useRef<EditMealSheetRef>(null);
  const editItemSheet = useRef<EditItemSheetRef>(null);
  const { recipes, items } = useUserMealPlanData(listId);
  const { mutateAsync: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
  const { mutateAsync: updateMealPlanItem } = useUpdateMealPlanItem();
  const [dateAnchor, setDateAnchor] = useState(() => startOfDay(new Date()));
  const dayListSections = useMemo(
    () =>
      buildMealPlanDayListSections({ anchorDate: dateAnchor, recipes, items }),
    [dateAnchor, recipes, items]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const today = startOfDay(new Date());
        setDateAnchor(current => (isSameDay(current, today) ? current : today));
      }
    });
    return () => subscription.remove();
  }, []);

  const lastFocusedRequest = useRef<number | null>(null);
  useEffect(() => {
    if (!focusRequest?.mealId || lastFocusedRequest.current === focusRequest.id)
      return;
    const meal = recipes.find(m => m.id === focusRequest.mealId);
    const item = items.find(i => i.id === focusRequest.mealId);
    if (!meal && !item) return;
    lastFocusedRequest.current = focusRequest.id;
    if (meal)
      editMealSheet.current?.open({
        mealPlanRecipe: meal,
        recipe: meal.recipe,
        focusSourceId: focusRequest.sourceId,
      });
    else if (item) editItemSheet.current?.open(item);
  }, [focusRequest, recipes, items]);

  const handleItemPress = useCallback((item: MealPlanItemWithStore) => {
    editItemSheet.current?.open(item);
  }, []);

  const handleMealPress = useCallback<
    React.ComponentProps<typeof MealPlanDateView>['onMealPress']
  >(({ mealPlanRecipe, recipe }) => {
    editMealSheet.current?.open({ mealPlanRecipe, recipe });
  }, []);

  const handleMoveMealPlanEntry = useCallback<MoveMealPlanEntry>(
    async (entry, targetDate) => {
      if (entry.date === targetDate) return;

      if (entry.type === 'recipe') {
        await updateMealPlanRecipe({
          mealPlanRecipeId: entry.id,
          updates: { date: targetDate },
        });
        return;
      }

      await updateMealPlanItem({
        mealPlanItemId: entry.id,
        updates: { date: targetDate },
      });
    },
    [updateMealPlanRecipe, updateMealPlanItem]
  );

  const openAddSheetForDate = useCallback((dateKey: string) => {
    addToMealPlanSheet.current?.present({ defaultDate: dateKey });
  }, []);

  const handleAddPress = () => {
    openAddSheetForDate(format(dateAnchor, 'yyyy-MM-dd'));
  };

  // Warm the meal projection and day sections in the background. Native
  // calendar/drag-drop layout and closed editors are not startup work.
  if (!isActive && !hasBeenActive) return null;

  return (
    <View style={{ flex: 1 }}>
      {showHeader ? (
        <View className="flex-row items-center px-4">
          <View className="h-10 flex-1 justify-center">
            <Button
              onPress={onViewListsPress}
              disabled={!onViewListsPress}
              variant="ghost"
              className="self-start px-0 active:bg-transparent dark:active:bg-transparent"
            >
              <Heading>{listName ?? 'Meal Plan'}</Heading>
            </Button>
          </View>
          <MealPlanDropdownMenu recipes={recipes} items={items} />
        </View>
      ) : null}
      <AddToMealPlanSheet listId={listId} ref={addToMealPlanSheet} />
      <EditMealSheet ref={editMealSheet} listId={listId} />
      <EditItemSheet ref={editItemSheet} listId={listId} />
      <MealPlanDateView
        key={dayListSections[MEAL_PLAN_DAY_LIST_PAST_DAYS]?.dateKey}
        dayListSections={dayListSections}
        onDayPress={openAddSheetForDate}
        onMoveEntry={handleMoveMealPlanEntry}
        onMealPress={handleMealPress}
        onItemPress={handleItemPress}
        focusRequest={focusRequest}
      />
      <Button
        size="wide-small"
        onPress={handleAddPress}
        className="absolute bottom-8 right-6 z-10"
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
});
