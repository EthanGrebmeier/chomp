import { eachDayOfInterval, format } from 'date-fns';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/button';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { useMealPlan } from '../hooks';
import { MealPlanDay } from '../types';
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
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId);
  const theme = useTheme();
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
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-foreground">
            {mealPlan?.name || 'Meal Planner'}
          </Text>
        </View>
      </View>
      <MealSheet
        ref={mealSheetRef}
        mealPlanId={mealPlanId}
        startDate={startDate}
        endDate={endDate}
      />
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
                          console.log('mealPlanRecipe', mealPlanRecipe);
                          console.log(
                            'mealPlanRecipe.recipe',
                            mealPlanRecipe.recipe
                          );
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
