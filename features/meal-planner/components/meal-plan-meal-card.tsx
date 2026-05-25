import { useRef } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import { DraxView } from 'react-native-drax';

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
  const pressGestureStateRef = useRef({
    startX: 0,
    startY: 0,
    isDragGesture: false,
  });
  const recipeWithIngredients = recipe as unknown as {
    recipe_ingredients?: unknown[];
  };
  const DRAG_DISTANCE_THRESHOLD = 8;
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

  const handlePressIn = (event: GestureResponderEvent) => {
    pressGestureStateRef.current = {
      startX: event.nativeEvent.pageX,
      startY: event.nativeEvent.pageY,
      isDragGesture: false,
    };
  };

  const markAsDragGestureIfMoved = (event: GestureResponderEvent) => {
    const { startX, startY } = pressGestureStateRef.current;
    const horizontalDistance = Math.abs(event.nativeEvent.pageX - startX);
    const verticalDistance = Math.abs(event.nativeEvent.pageY - startY);

    if (
      horizontalDistance > DRAG_DISTANCE_THRESHOLD ||
      verticalDistance > DRAG_DISTANCE_THRESHOLD
    ) {
      pressGestureStateRef.current.isDragGesture = true;
    }
  };

  const handleMealCardPress = () => {
    if (pressGestureStateRef.current.isDragGesture) {
      return;
    }

    onMealPress({
      mealPlanRecipe,
      recipe,
    });
  };

  return (
    <DraxView
      draggingStyle={{
        opacity: 0.5,
      }}
      hoverDraggingStyle={{
        opacity: 0.8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }}
      longPressDelay={200}
      draggable
      payload={{
        type: 'recipe',
        id: mealPlanRecipe.id,
      }}
    >
      <ListItem
        className={cn(
          !isLast ? 'border-b border-dashed border-border' : undefined
        )}
      >
        <HapticPressable
          key={mealPlanRecipe.id}
          onPress={handleMealCardPress}
          onPressIn={handlePressIn}
          onTouchMove={markAsDragGestureIfMoved}
          onLongPress={() => {
            pressGestureStateRef.current.isDragGesture = true;
          }}
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
    </DraxView>
  );
};

export default MealPlanMealCard;
