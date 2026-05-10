import { Alert, View } from 'react-native';

import { ListItem } from '../../../components/ui/list-item';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { Recipe } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { MealPlanRecipe } from '../types';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipe;
  recipe: Recipe;
  isLast: boolean;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
  onIndicatorPress: (mealPlanRecipe: MealPlanRecipe) => void;
};

const MealPlanMealCard = ({
  mealPlanRecipe,
  recipe,
  isLast,
  onMealPress,
  onIndicatorPress,
}: MealPlanMealCardProps) => {
  const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();
  const recipeWithIngredients = recipe as unknown as {
    recipe_ingredients?: unknown[];
  };
  const ingredientCount = Array.isArray(recipeWithIngredients.recipe_ingredients)
    ? recipeWithIngredients.recipe_ingredients.length
    : undefined;

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
        <ListItem
          className={!isLast ? 'border-b border-dashed border-border' : undefined}
        >
          <HapticPressable
            key={mealPlanRecipe.id}
            onPress={() =>
              onMealPress({
                mealPlanRecipe,
                recipe,
              })
            }
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
      }
    >
      <ContextMenuItem key="delete-meal" destructive onSelect={handleDelete}>
        <ContextMenuItemTitle>Delete Meal</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanMealCard;
