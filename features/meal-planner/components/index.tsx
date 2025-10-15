import { eachDayOfInterval, format } from 'date-fns';
import { FlatList, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useMealPlan } from '../hooks';
import { MealPlanDay } from '../types';
import { AddMealSheet } from './add-meal-sheet';

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
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId);
  const daysOfPlan = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getRecipesForDate = (date: Date): MealPlanDay['recipes'] => {
    if (!mealPlan) return [];
    return mealPlan.recipes.filter(
      recipe => recipe.date === date.toISOString()
    );
  };

  console.log(mealPlan);

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading meal plan...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-foreground">
          {mealPlan?.name || 'Meal Planner'}
        </Text>
      </View>
      <Animated.FlatList
        data={daysOfPlan}
        contentContainerClassName="pb-20"
        itemLayoutAnimation={LinearTransition}
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
                  <AddMealSheet
                    mealPlanId={mealPlanId}
                    date={date.toISOString()}
                  />
                </View>
                {recipes.length === 0 ? (
                  <Text className="mt-1 text-muted-foreground">
                    No meals planned
                  </Text>
                ) : (
                  <FlatList
                    data={recipes}
                    renderItem={({ item: recipe }) => (
                      <Text>{recipe.recipe.name}</Text>
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
