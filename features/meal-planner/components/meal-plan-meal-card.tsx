import { View } from 'react-native';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { Recipe } from '../../recipes/types';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { MealPlanRecipeWithRecipe } from '../types';
import { getMealPlanShoppingState } from '../utils/shopping-state';

import { MealPlanOnlyLabel } from './meal-plan-only';

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
          {shoppingState.allPurchased ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              All ingredients purchased
            </Text>
          ) : shoppingState.purchasedCount > 0 ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {shoppingState.purchasedCount} of {shoppingState.includedCount}{' '}
              purchased
            </Text>
          ) : mealPlanRecipe.ignoredByGroceryList ? (
            <MealPlanOnlyLabel />
          ) : !shoppingState.isShownOnGroceryList ? (
            <Text className="text-sm text-muted-foreground">
              Not on grocery list
            </Text>
          ) : null}
        </View>
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
