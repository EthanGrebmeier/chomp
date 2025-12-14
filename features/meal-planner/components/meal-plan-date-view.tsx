import { Image } from 'expo-image';
import { CameraIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import { FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { HapticTouchableOpacity } from '../../../components/ui/haptic-touchable-opacity';
import { Icon } from '../../../components/ui/icon';
import { useTheme } from '../../../hooks/use-theme';
import { ACCENT_COLORS } from '../../../lib/theme';
import { Recipe } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { MealPlanRecipe, MealTag } from '../types';

type MealPlanDateViewProps = {
  recipes: (MealPlanRecipe & { recipe: Recipe })[];
  date: string;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
  onAddMealPress: ({
    date,
    mealTime,
  }: {
    date: string;
    mealTime: MealTag;
  }) => void;
};

const mealTimes: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
];

export const MealPlanDateView = ({
  recipes,
  date,
  onMealPress,
  onAddMealPress,
}: MealPlanDateViewProps) => {
  const theme = useTheme();
  const groupedRecipes = recipes.reduce(
    (acc, recipe) => {
      // Skip if no mealTag or no recipe linked
      if (!recipe.mealTag || !recipe.recipe) return acc;
      const tag = recipe.mealTag as MealTag;
      acc[tag] = [...(acc[tag] || []), recipe];
      return acc;
    },
    {} as Record<MealTag, (MealPlanRecipe & { recipe: Recipe })[]>
  );

  const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();

  return (
    <FlatList
      contentContainerClassName="pb-20"
      data={mealTimes}
      renderItem={({ item: mealTime }) => (
        <View className="mb-2 gap-1 px-4">
          <Text className="text-xl font-semibold capitalize text-foreground">
            {mealTime}
          </Text>
          {groupedRecipes[mealTime] ? (
            <Animated.View
              entering={FadeIn.duration(140)}
              exiting={FadeOut.duration(140)}
            >
              <View>
                <FlatList
                  data={groupedRecipes[mealTime]}
                  renderItem={({ item: mealPlanRecipe }) => {
                    const recipe = mealPlanRecipe.recipe;
                    if (!recipe) return null;

                    return (
                      <HapticPressable
                        onPress={() =>
                          onMealPress({
                            mealPlanRecipe,
                            recipe,
                          })
                        }
                      >
                        <View className="w-full flex-row items-center gap-4 rounded-xl bg-muted px-4 py-2">
                          <View className="size-14 items-center justify-center overflow-hidden rounded-sm bg-gray-200">
                            {recipe.imageSrc ? (
                              <Image
                                source={{ uri: recipe.imageSrc }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            ) : (
                              <Icon
                                className="text-muted-foreground"
                                as={CameraIcon}
                                size={24}
                              />
                            )}
                          </View>
                          <View className="flex-1 flex-row justify-between">
                            <Text className="text-lg font-semibold text-foreground">
                              {recipe.name}
                            </Text>
                            <HapticPressable
                              onPress={() =>
                                removeRecipeFromMealPlan({
                                  mealPlanRecipeId: mealPlanRecipe.id,
                                })
                              }
                            >
                              <Icon
                                as={Trash2Icon}
                                size={20}
                                color={theme.destructive}
                              />
                            </HapticPressable>
                          </View>
                        </View>
                      </HapticPressable>
                    );
                  }}
                />
              </View>
            </Animated.View>
          ) : (
            <HapticTouchableOpacity
              hapticType="light"
              onPress={() => onAddMealPress({ date: date, mealTime })}
              className="h-[72] w-full items-center justify-center rounded-xl bg-muted"
            >
              <View className="flex-row items-center justify-center gap-1">
                <Icon
                  as={PlusIcon}
                  size={16}
                  color={ACCENT_COLORS.orange.foreground}
                />
                <Text className="text-sm font-semibold text-accent-orange-foreground">
                  Select Recipe
                </Text>
              </View>
            </HapticTouchableOpacity>
          )}
        </View>
      )}
    />
  );
};
