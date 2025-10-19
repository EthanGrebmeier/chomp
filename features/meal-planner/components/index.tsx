import { eachDayOfInterval, format } from 'date-fns';
import { NotebookTabsIcon, PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { EditableHeader } from '../../../components/editable-header';
import { Button } from '../../../components/ui/button';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { useMealPlan } from '../hooks';
import { useUpdateMealPlan } from '../hooks/useUpdateMealPlan';
import { MealPlanDay } from '../types';
import {
  AddToGroceryListSheet,
  AddToGroceryListSheetRef,
} from './add-to-grocery-list-sheet';
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
  const mealSheetRef = useRef<MealSheetRef>(null);
  const addToGroceryListSheetRef = useRef<AddToGroceryListSheetRef>(null);
  const textInputRef = useRef<TextInput>(null);
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId);
  const { mutate: updateMealPlan } = useUpdateMealPlan();
  const theme = useTheme();
  const daysOfPlan = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const getRecipesForDate = (date: Date): MealPlanDay['recipes'] => {
    if (!mealPlan) return [];
    return mealPlan.recipes.filter(
      recipe => recipe.date === date.toISOString()
    );
  };

  const groupRecipesByMeal = (recipes: MealPlanDay['recipes']) => {
    const grouped = recipes.reduce(
      (acc, recipe) => {
        const mealTag = recipe.mealTag || 'meal';
        if (!acc[mealTag]) {
          acc[mealTag] = [];
        }
        acc[mealTag].push(recipe);
        return acc;
      },
      {} as Record<string, MealPlanDay['recipes']>
    );

    return grouped;
  };

  const handleChangeText = (text: string) => {
    updateMealPlan({
      mealPlanId,
      updates: { name: text },
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
    <View className="flex-1">
      <EditableHeader
        ref={textInputRef}
        value={mealPlan?.name || 'Meal Planner'}
        onChangeText={handleChangeText}
      >
        {mealPlan?.startDate && mealPlan?.endDate && (
          <Text className="text-lg text-muted-foreground">
            {format(new Date(mealPlan.startDate), 'EE, M/d/yy')} -{' '}
            {format(new Date(mealPlan.endDate), 'EE, M/d/yy')}
          </Text>
        )}
      </EditableHeader>
      <MealSheet
        ref={mealSheetRef}
        mealPlanId={mealPlanId}
        startDate={startDate}
        endDate={endDate}
      />
      <AddToGroceryListSheet
        ref={addToGroceryListSheetRef}
        mealPlanId={mealPlanId}
        mealPlanName={mealPlan?.name || 'Meal Plan'}
      />
      <View className="bottom-safe absolute right-4 z-10">
        <Button
          onPress={() => addToGroceryListSheetRef.current?.open()}
          className="flex-row items-center gap-2"
        >
          <NotebookTabsIcon size={16} color={theme.primaryForeground} />
          <Text>Add to List</Text>
        </Button>
      </View>
      <Animated.FlatList
        data={daysOfPlan}
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
        renderItem={({ item: date }) => {
          const recipes = getRecipesForDate(date);
          //   const groupedRecipes = groupRecipesByMeal(recipes);

          return (
            <ListItem key={date.toISOString()} className="mb-2">
              <View className="flex-1">
                <View className="flex-1 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-foreground">
                    {format(date, 'EEEE, M/d/yy')}
                  </Text>
                  <Button
                    onPress={() =>
                      mealSheetRef.current?.openForAdd({
                        date: date.toISOString(),
                      })
                    }
                    className="size-6 rounded-full p-0"
                  >
                    <PlusIcon size={16} color={theme.primaryForeground} />
                  </Button>
                </View>
                {recipes.length === 0 ? (
                  <Text className="mt-1 text-muted-foreground">
                    No meals planned
                  </Text>
                ) : (
                  <FlatList
                    data={recipes}
                    renderItem={({ item: mealPlanRecipe }) => (
                      <Pressable
                        onPress={() => {
                          mealSheetRef.current?.openForEdit({
                            mealPlanRecipe,
                            recipe: mealPlanRecipe.recipe,
                          });
                        }}
                      >
                        <Text>{mealPlanRecipe.recipe.name}</Text>
                      </Pressable>
                    )}
                  />
                )}
              </View>
            </ListItem>
          );
        }}
      />
    </View>
  );
};
