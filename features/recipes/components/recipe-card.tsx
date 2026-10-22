import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

import { MealTagBadge } from './meal-tag-badge';

const compactTextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: undefined,
});

type RecipeCardContentProps = {
  name: string;
  className?: string;
};

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  className?: string;
  listId?: string;
};

/** Recipe title using the shared list-row type scale (matches grocery/saved item rows). */
export const RecipeCardContent = ({
  name,
  className,
}: RecipeCardContentProps) => {
  return (
    <View className={className}>
      <Text variant="itemTitle" style={compactTextStyle} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
};

export const RecipeCard = ({ recipe, className, listId }: RecipeCardProps) => {
  return (
    <HapticPressable
      className="w-full flex-row items-start gap-3 py-1"
      hapticType="selection"
      onPress={() => router.push(navigation.goToRecipe(recipe.id, listId))}
    >
      <RecipeCardContent
        name={recipe.name}
        className={cn('flex-1', className)}
      />
      <MealTagBadge mealTag={recipe.mealTag} />
    </HapticPressable>
  );
};
