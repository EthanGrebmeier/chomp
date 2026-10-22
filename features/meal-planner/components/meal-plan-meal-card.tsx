import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Recipe } from '../../recipes/types';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { MealPlanRecipeWithRecipe } from '../types';
import { getMealPlanShoppingState } from '../utils/shopping-state';

import { MealPlanCardContent } from './meal-plan-card-content';
import { MEAL_PLAN_ONLY_LABEL } from './meal-plan-only';

type MealPlanMealCardProps = {
  mealPlanRecipe: MealPlanRecipeWithRecipe;
  recipe: Recipe;
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
  contextMenuEnabled = true,
  onMealPress,
}: MealPlanMealCardProps) => {
  const shoppingState = getMealPlanShoppingState(mealPlanRecipe);
  const {
    isMealPlanOnly: mealPlanOnly,
    setMealPlanOnly,
    isPending,
  } = useMealPlanOnlyToggle({
    entry: { type: 'recipe', id: mealPlanRecipe.id },
    isMealPlanOnly: !shoppingState.isShownOnGroceryList,
  });
  const ingredientCount =
    (mealPlanRecipe.ingredient_snapshots?.length ?? 0) > 0
      ? shoppingState.includedCount
      : mealPlanRecipe.recipe.recipe_ingredients?.length;

  const statusLabel = shoppingState.allPurchased
    ? 'All purchased'
    : shoppingState.purchasedCount > 0
      ? `${shoppingState.purchasedCount} of ${shoppingState.includedCount} purchased`
      : mealPlanRecipe.ignoredByGroceryList
        ? MEAL_PLAN_ONLY_LABEL
        : !shoppingState.isShownOnGroceryList
          ? 'Not on grocery list'
          : null;

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

  if (!contextMenuEnabled) return card;

  return (
    <ContextMenuRoot trigger={card}>
      <ContextMenuItem
        key="toggle-meal-plan-only"
        disabled={
          isPending ||
          (mealPlanRecipe.recipe.recipe_ingredients?.length ?? 0) === 0
        }
        onSelect={() => {
          if (
            !isPending &&
            (mealPlanRecipe.recipe.recipe_ingredients?.length ?? 0) > 0
          )
            setMealPlanOnly(!mealPlanOnly);
        }}
      >
        <ContextMenuItemTitle>
          {mealPlanOnly ? 'Add to list' : 'Hide from list'}
        </ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanMealCard;
