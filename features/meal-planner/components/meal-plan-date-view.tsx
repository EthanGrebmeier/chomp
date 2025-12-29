import { CookingPotIcon } from 'lucide-react-native';
import { FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { MealPlanItemWithStore, MealPlanRecipe, MealTag } from '../types';

import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type MealPlanDateViewProps = {
  recipes: (MealPlanRecipe & { recipe: Recipe })[];
  items: MealPlanItemWithStore[];
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
  onItemPress: (item: MealPlanItemWithStore) => void;
};

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

export const MealPlanDateView = ({
  recipes,
  items,
  onMealPress,
  onItemPress,
}: MealPlanDateViewProps) => {
  // Group recipes by meal time
  const groupedRecipes = recipes.reduce(
    (acc, recipe) => {
      if (!recipe.recipe) return acc;
      const tag = (recipe.mealTag as MealTag) || 'None'; // Default to None if no mealTag
      acc[tag] = [...(acc[tag] || []), recipe];
      return acc;
    },
    {} as Record<MealTag, (MealPlanRecipe & { recipe: Recipe })[]>
  );

  // Group items by meal time
  const groupedItems = items.reduce(
    (acc, item) => {
      const tag = (item.mealTag as MealTag) || 'None'; // Default to None if no mealTag
      acc[tag] = [...(acc[tag] ?? []), item];
      return acc;
    },
    {} as Record<MealTag, MealPlanItemWithStore[]>
  );

  // Only include meal times that have recipes or items
  const mealTimesWithContent = mealTimeOrder.filter(
    mealTime =>
      (groupedRecipes[mealTime]?.length ?? 0) +
        (groupedItems[mealTime]?.length ?? 0) >
      0
  );

  // Empty state when no meals or items
  if (mealTimesWithContent.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
        className="flex-1 items-center justify-center gap-2 px-4"
      >
        <Icon
          as={CookingPotIcon}
          size={48}
          className="text-muted-foreground"
          style={{ marginTop: -NATIVE_TABS_OFFSET }}
        />
        <EmptyHeading>No meals planned</EmptyHeading>
        <EmptySubtext>Tap the + button to add a meal</EmptySubtext>
      </Animated.View>
    );
  }

  return (
    <FlatList
      contentContainerClassName="pb-20"
      data={mealTimesWithContent}
      keyExtractor={item => item}
      renderItem={({ item: mealTime }) => (
        <View className="mb-4 gap-2 px-4">
          <Text className="text-lg font-semibold capitalize text-muted-foreground">
            {mealTime}
          </Text>
          <Animated.View
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(140)}
          >
            <View className="gap-2">
              {groupedRecipes[mealTime]?.map(mealPlanRecipe => {
                const recipe = mealPlanRecipe.recipe;
                if (!recipe) return null;

                return (
                  <MealPlanMealCard
                    key={mealPlanRecipe.id}
                    mealPlanRecipe={mealPlanRecipe}
                    recipe={recipe}
                    onMealPress={onMealPress}
                  />
                );
              })}
              {groupedItems[mealTime]?.map(mealPlanItem => (
                <MealPlanItemCard
                  key={mealPlanItem.id}
                  mealPlanItem={mealPlanItem}
                  onItemPress={onItemPress}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    />
  );
};
