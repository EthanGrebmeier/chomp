import { router } from 'expo-router';

import { navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { RecipeWithIngredients } from '../types';

import { RecipeSummary } from './recipe-summary';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  className?: string;
  listId?: string;
  onPress?: () => void;
};

export const RecipeCard = ({
  recipe,
  className,
  listId,
  onPress,
}: RecipeCardProps) => {
  return (
    <HapticPressable
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      className={cn('w-full px-4 py-3.5 active:bg-recipe-pressed', className)}
      hapticType="selection"
      onPress={
        onPress ?? (() => router.push(navigation.goToRecipe(recipe.id, listId)))
      }
    >
      <RecipeSummary
        name={recipe.name}
        ingredientCount={recipe.recipe_ingredients.length}
        servings={recipe.servings}
        mealTag={recipe.mealTag}
      />
    </HapticPressable>
  );
};
