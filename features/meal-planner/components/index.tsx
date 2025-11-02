import { eachDayOfInterval, format } from 'date-fns';
import { NotebookTabsIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { EditableHeader } from '../../../components/editable-header';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import {
  AddToGroceryListSheet,
  AddToGroceryListSheetRef,
} from '../../shared/components';
import { useMealPlan } from '../hooks';
import { useAddMealPlanToGroceryList } from '../hooks/useAddMealPlanToGroceryList';
import { useUpdateMealPlan } from '../hooks/useUpdateMealPlan';
import { MealPlanDay } from '../types';
import MealPlanDateSelector from './date-selector/meal-plan-date-selector';
import { MealPlanDateView } from './meal-plan-date-view';
import { MealSheet, MealSheetRef } from './meal-sheet';

type MealPlannerProps = {
  mealPlanId: string;
  startDate: string;
  endDate: string;
};

export const MealPlanner = ({
  mealPlanId,
  startDate,
  endDate,
}: MealPlannerProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(startDate));
  const mealSheetRef = useRef<MealSheetRef>(null);
  const addToGroceryListSheetRef = useRef<AddToGroceryListSheetRef>(null);
  const textInputRef = useRef<TextInput>(null);
  const startDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const endDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId);
  const { mutate: updateMealPlan } = useUpdateMealPlan();
  const { mutate: addMealPlanToGroceryList } = useAddMealPlanToGroceryList();
  const theme = useTheme();
  const daysOfPlan = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const getRecipesForDate = (date: Date): MealPlanDay['recipes'] => {
    if (!mealPlan) return [];
    return mealPlan.recipes.filter(
      recipe => recipe.date === format(date, 'yyyy-MM-dd')
    );
  };

  const handleChangeText = (text: string) => {
    updateMealPlan({
      mealPlanId,
      updates: { name: text },
    });
  };
  const handleChangeStartDate = (date: Date) => {
    updateMealPlan({
      mealPlanId,
      updates: {
        startDate: format(date, 'yyyy-MM-dd') + 'T00:00:00',
      },
    });
  };
  const handleChangeEndDate = (date: Date) => {
    updateMealPlan({
      mealPlanId,
      updates: {
        endDate: format(date, 'yyyy-MM-dd') + 'T00:00:00',
      },
    });
  };

  const handleAddMealPlanToList = async (
    listId: string,
    isNewList: boolean
  ) => {
    return new Promise<void>((resolve, reject) => {
      addMealPlanToGroceryList(
        {
          mealPlanId,
          groceryListId: listId,
          groceryListName: isNewList
            ? `${mealPlan?.name || 'Meal Plan'} - Grocery List`
            : undefined,
        },
        {
          onSuccess: () => {
            resolve();
          },
          onError: error => {
            console.error('Failed to add meal plan to grocery list:', error);
            reject(error);
          },
        }
      );
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading meal plan...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-2">
      <EditableHeader
        ref={textInputRef}
        value={mealPlan?.name || 'Meal Planner'}
        onChangeText={handleChangeText}
      >
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
      </EditableHeader>
      <CalendarSheet
        onChange={handleChangeStartDate}
        ref={startDateSheetRef}
        headerTitle="Select Start Date"
      />
      <CalendarSheet
        onChange={handleChangeEndDate}
        ref={endDateSheetRef}
        headerTitle="Select End Date"
      />
      <MealSheet
        ref={mealSheetRef}
        mealPlanId={mealPlanId}
        startDate={startDate}
        endDate={endDate}
      />
      <AddToGroceryListSheet
        ref={addToGroceryListSheetRef}
        onListSelected={handleAddMealPlanToList}
        title="Add Meal Plan to Grocery List"
        createNewButtonText="Create New List & Add Meal Plan"
      />
      <View className="absolute bottom-4 right-4 z-10">
        <Button
          onPress={() => addToGroceryListSheetRef.current?.open()}
          className="flex-row items-center gap-2"
        >
          <Icon
            as={NotebookTabsIcon}
            size={16}
            color={theme.primaryForeground}
          />
          <Text>Add to List</Text>
        </Button>
      </View>
      <MealPlanDateSelector
        dates={daysOfPlan}
        currentDate={currentDate}
        onDatePress={setCurrentDate}
      />
      <MealPlanDateView
        recipes={getRecipesForDate(currentDate)}
        date={format(currentDate, 'yyyy-MM-dd')}
        onMealPress={({ mealPlanRecipe, recipe }) =>
          mealSheetRef.current?.openForEdit({ mealPlanRecipe, recipe })
        }
        onAddMealPress={({ date, mealTime }) =>
          mealSheetRef.current?.openForAdd({ date, mealTime })
        }
      />
    </View>
  );
};
