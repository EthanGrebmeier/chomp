import { Alert, View } from 'react-native';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { MealPlanRecipe } from '../types';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipe;
  recipe: Recipe;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
};

const MealPlanMealCard = ({
  mealPlanRecipe,
  recipe,
  onMealPress,
}: MealPlanMealCardProps) => {
  const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${recipe.name}" from your meal plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            removeRecipeFromMealPlan({ mealPlanRecipeId: mealPlanRecipe.id }),
        },
      ]
    );
  };

  return (
    <ContextMenuRoot
      trigger={
        <HapticPressable
          key={mealPlanRecipe.id}
          onPress={() =>
            onMealPress({
              mealPlanRecipe,
              recipe,
            })
          }
        >
          <View className="w-full rounded-xl bg-muted px-4 py-3">
            <Text className="text-xl font-semibold text-foreground">
              {recipe.name}
            </Text>
          </View>
        </HapticPressable>
      }
    >
      <ContextMenuItem key="delete-meal" destructive onSelect={handleDelete}>
        <ContextMenuItemTitle>Delete Meal</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanMealCard;
