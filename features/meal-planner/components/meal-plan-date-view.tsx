import { Image } from 'expo-image';
import { useCallback } from 'react';
import { Alert, FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import { useAddMealsToGroceryList, useUnmarkMealAdded } from '../hooks';
import { MealPlanItemWithStore, MealPlanRecipe, MealTag } from '../types';

import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type MealPlanDateViewProps = {
  listId: string;
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
  listId,
  recipes,
  items,
  onMealPress,
  onItemPress,
}: MealPlanDateViewProps) => {
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();
  const { mutate: unmarkMealAdded } = useUnmarkMealAdded();

  const handleIndicatorPress = useCallback(
    (
      type: 'recipe' | 'item',
      id: string,
      name: string,
      addedToList: boolean
    ) => {
      if (isAddingToList) return;

      if (addedToList) {
        Alert.alert(
          'Already Added',
          `"${name}" has already been added to a grocery list. Would you like to mark it as unadded?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Unadded',
              onPress: () => unmarkMealAdded({ type, id }),
            },
          ]
        );
      } else {
        const args =
          type === 'recipe'
            ? { listId, selectedRecipeIds: [id] }
            : { listId, selectedItemIds: [id] };

        addMealsToGroceryList(args, {
          onSuccess: result => {
            const totalAdded = result.addedRecipes + result.addedItems;
            if (totalAdded === 0) {
              toast.info('Already added to list');
            } else {
              toast.success(`Added ${name} to list`);
            }
          },
          onError: () => {
            toast.error('Failed to add to list');
          },
        });
      }
    },
    [addMealsToGroceryList, isAddingToList, listId, unmarkMealAdded]
  );

  const handleRecipeIndicatorPress = useCallback(
    (mealPlanRecipe: MealPlanRecipe) => {
      // Find the recipe name from the recipes prop
      const match = recipes.find(r => r.id === mealPlanRecipe.id);
      const name = match?.recipe?.name ?? 'Recipe';
      handleIndicatorPress(
        'recipe',
        mealPlanRecipe.id,
        name,
        !!mealPlanRecipe.addedToList
      );
    },
    [recipes, handleIndicatorPress]
  );

  const handleItemIndicatorPress = useCallback(
    (mealPlanItem: MealPlanItemWithStore) => {
      handleIndicatorPress(
        'item',
        mealPlanItem.id,
        mealPlanItem.name,
        !!mealPlanItem.addedToList
      );
    },
    [handleIndicatorPress]
  );

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
        className="flex-1 items-center justify-center px-4"
      >
        <View className="-mt-24">
          <View className="w-48">
            <Image
              source={require('../../../assets/images/NoMeals.png')}
              style={{
                width: 'auto',
                height: 140,
              }}
              contentFit="contain"
            />
          </View>
          <EmptyHeading className="mt-4">No meals planned</EmptyHeading>
          <EmptySubtext>Tap the + button to add a meal</EmptySubtext>
        </View>
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
                    onIndicatorPress={handleRecipeIndicatorPress}
                  />
                );
              })}
              {groupedItems[mealTime]?.map(mealPlanItem => (
                <MealPlanItemCard
                  key={mealPlanItem.id}
                  mealPlanItem={mealPlanItem}
                  onItemPress={onItemPress}
                  onIndicatorPress={handleItemIndicatorPress}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    />
  );
};
