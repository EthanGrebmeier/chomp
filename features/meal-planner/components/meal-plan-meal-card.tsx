import { View } from 'react-native';

import { Checkbox } from '../../../components/ui/checkbox';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { cn } from '../../../lib/utils';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { Recipe } from '../../recipes/types';
import { MealPlanRecipeWithRecipe } from '../types';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipeWithRecipe;
  recipe: Recipe;
  isLast: boolean;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipeWithRecipe;
    recipe: Recipe;
  }) => void;
  onIndicatorPress: (mealPlanRecipe: MealPlanRecipeWithRecipe) => void;
};

const MealPlanMealCard = ({
  mealPlanRecipe,
  recipe,
  isLast,
  onMealPress,
  onIndicatorPress,
}: MealPlanMealCardProps) => {
  const recipeWithIngredients = recipe as unknown as {
    recipe_ingredients?: unknown[];
  };
  const selectedIngredientCount = mealPlanRecipe.ingredient_snapshots?.filter(
    snapshot => snapshot.isSelected
  ).length;
  const ingredientCount =
    typeof selectedIngredientCount === 'number' &&
    (mealPlanRecipe.ingredient_snapshots?.length ?? 0) > 0
      ? selectedIngredientCount
      : Array.isArray(recipeWithIngredients.recipe_ingredients)
        ? recipeWithIngredients.recipe_ingredients.length
        : undefined;

  const handleMealCardPress = () => {
    onMealPress({
      mealPlanRecipe,
      recipe,
    });
  };

  return (
    <ListItem
      className={cn(
        !isLast ? 'border-b border-dashed border-border' : undefined
      )}
    >
      <HapticPressable
        key={mealPlanRecipe.id}
        onPress={handleMealCardPress}
        className="flex-1"
      >
        <View className="w-full flex-row items-center gap-3 py-1">
          <Checkbox
            checked={!!mealPlanRecipe.addedToList}
            onPress={() => onIndicatorPress(mealPlanRecipe)}
          />
          <RecipeCardContent
            name={recipe.name}
            ingredientCount={ingredientCount}
            className="flex-1"
          />
        </View>
      </HapticPressable>
    </ListItem>
  );
};

export default MealPlanMealCard;
