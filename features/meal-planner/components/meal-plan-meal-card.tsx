import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Recipe } from '../../recipes/types';
import { MealPlanRecipeWithRecipe } from '../types';
import { getMealPlanShoppingState } from '../utils/shopping-state';

import { MealPlanCardContent } from './meal-plan-card-content';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipeWithRecipe;
  recipe: Recipe;
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
  onMealPress,
}: MealPlanMealCardProps) => {
  const shoppingState = getMealPlanShoppingState(mealPlanRecipe);
  const ingredientCount =
    (mealPlanRecipe.ingredient_snapshots?.length ?? 0) > 0
      ? shoppingState.includedCount
      : mealPlanRecipe.recipe.recipe_ingredients?.length;

  const statusLabel = shoppingState.allPurchased
    ? 'All purchased'
    : shoppingState.purchasedCount > 0
      ? `${shoppingState.purchasedCount} of ${shoppingState.includedCount} purchased`
      : !shoppingState.isShownOnGroceryList
        ? 'Not on grocery list'
        : null;

  const handleMealCardPress = () => {
    onMealPress({
      mealPlanRecipe,
      recipe,
    });
  };

  return (
    <ListItem>
      <HapticPressable
        key={mealPlanRecipe.id}
        onPress={handleMealCardPress}
        className="flex-1"
      >
        <MealPlanCardContent
          title={recipe.name}
          meta={[
            typeof ingredientCount === 'number' &&
              `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`,
            statusLabel,
          ]}
          mealTag={mealPlanRecipe.mealTag}
        />
      </HapticPressable>
    </ListItem>
  );
};

export default MealPlanMealCard;
