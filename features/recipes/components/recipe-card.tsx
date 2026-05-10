import { router } from 'expo-router';
import { View } from 'react-native';

import { navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardContentProps = {
  name: string;
  ingredientCount?: number;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  className?: string;
  listId?: string;
};

const getIngredientLabel = (ingredientCount: number) =>
  `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`;

export const RecipeCardContent = ({
  name,
  ingredientCount,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}: RecipeCardContentProps) => {
  const resolvedSubtitle =
    subtitle ??
    (typeof ingredientCount === 'number'
      ? getIngredientLabel(ingredientCount)
      : undefined);

  return (
    <View className={className}>
      <View className="w-full flex-row items-center justify-between">
        <Text
          className={cn(
            'overflow-ellipsis text-xl font-medium',
            titleClassName
          )}
          numberOfLines={2}
        >
          {name}
        </Text>
      </View>
      {resolvedSubtitle ? (
        <Text
          className={cn('text-sm text-muted-foreground', subtitleClassName)}
          numberOfLines={1}
        >
          {resolvedSubtitle}
        </Text>
      ) : null}
    </View>
  );
};

export const RecipeCard = ({ recipe, className, listId }: RecipeCardProps) => {
  return (
    <HapticPressable
      className="w-full py-1"
      hapticType="selection"
      onPress={() => router.push(navigation.goToRecipe(recipe.id, listId))}
    >
      <RecipeCardContent
        name={recipe.name}
        ingredientCount={recipe.recipe_ingredients.length}
        className={className}
      />
    </HapticPressable>
  );
};
