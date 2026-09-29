import { View } from 'react-native';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { Recipe } from '../../recipes/types';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { isMealPlanOnly } from '../instant/meal-plan-entry';
import { MealPlanRecipeWithRecipe } from '../types';

import { MEAL_PLAN_ONLY_LABEL, MealPlanOnlyLabel } from './meal-plan-only';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipeWithRecipe;
  recipe: Recipe;
  isLast: boolean;
  contextMenuEnabled?: boolean;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipeWithRecipe;
    recipe: Recipe;
  }) => void;
};

const MealPlanMealCard = ({
  mealPlanRecipe,
  recipe,
  isLast,
  contextMenuEnabled = true,
  onMealPress,
}: MealPlanMealCardProps) => {
  const { isMealPlanOnly: mealPlanOnly, setMealPlanOnly } =
    useMealPlanOnlyToggle({
      entry: { type: 'recipe', id: mealPlanRecipe.id },
      isMealPlanOnly: isMealPlanOnly(mealPlanRecipe),
    });
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

  const card = (
    <ListItem>
      <HapticPressable
        key={mealPlanRecipe.id}
        onPress={handleMealCardPress}
        className="flex-1"
      >
        <View className="w-full py-1">
          <RecipeCardContent
            name={recipe.name}
            ingredientCount={ingredientCount}
          />
          {mealPlanOnly ? <MealPlanOnlyLabel /> : null}
        </View>
      </HapticPressable>
    </ListItem>
  );

  if (!contextMenuEnabled) return card;

  return (
    <ContextMenuRoot trigger={card}>
      <ContextMenuItem
        key="toggle-meal-plan-only"
        onSelect={() => setMealPlanOnly(!mealPlanOnly)}
      >
        <ContextMenuItemTitle>
          {mealPlanOnly ? 'Add to list' : MEAL_PLAN_ONLY_LABEL}
        </ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanMealCard;
