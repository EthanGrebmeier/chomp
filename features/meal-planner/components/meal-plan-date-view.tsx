import { Text } from '@/components/ui/text';
import { PlusIcon, Trash2Icon } from 'lucide-react-native';
import { FlatList, View } from 'react-native';
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
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
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
      if (!recipe.mealTag) return acc;
      acc[recipe.mealTag] = [...(acc[recipe.mealTag] || []), recipe];
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
        <View className="mb-2 gap-1 px-2">
          <Text className="text-xl font-semibold capitalize text-foreground">
            {mealTime}
          </Text>
          {groupedRecipes[mealTime] ? (
            <FlatList
              data={groupedRecipes[mealTime]}
              renderItem={({ item: mealPlanRecipe }) => (
                <HapticPressable
                  onPress={() =>
                    onMealPress({
                      mealPlanRecipe,
                      recipe: mealPlanRecipe.recipe,
                    })
                  }
                >
                  <View className="w-full flex-row items-center gap-4 rounded-xl bg-muted px-4 py-2">
                    <View className="size-14 rounded-sm bg-gray-200"></View>
                    <View className="flex-1 flex-row justify-between">
                      <Text className="text-lg font-semibold text-foreground">
                        {mealPlanRecipe.recipe.name}
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
              )}
            />
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
                <Text className="text-accent-orange-foreground text-sm font-semibold">
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
