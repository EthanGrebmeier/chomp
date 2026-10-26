import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { MealTagBadge } from './meal-tag-badge';

type RecipeSummaryProps = {
  name: string;
  ingredientCount: number;
  servings?: string | null;
  mealTag?: string | null;
};

/** Shared by the recipe book and its development layout previews. */
export function RecipeSummary({
  name,
  ingredientCount,
  servings,
  mealTag,
}: RecipeSummaryProps) {
  const servingLabel = servings?.trim();

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 gap-1">
        <Text className="text-lg leading-6" numberOfLines={2}>
          {name}
        </Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          {ingredientCount}{' '}
          {ingredientCount === 1 ? 'ingredient' : 'ingredients'}
          {servingLabel ? ` · Serves ${servingLabel}` : ''}
        </Text>
      </View>
      <MealTagBadge mealTag={mealTag} />
    </View>
  );
}
