import { View } from 'react-native';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
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
  return (
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
  );
};

export default MealPlanMealCard;
