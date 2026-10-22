import { View } from 'react-native';

import { Text } from '../../../components/ui/text';
import { MealTagBadge } from '../../recipes/components/meal-tag-badge';

type MealPlanCardContentProps = {
  title: string;
  /** Muted details joined into one line, e.g. ["4 ingredients", "Meal plan only"]. Falsy parts are skipped. */
  meta: (string | false | null | undefined)[];
  mealTag?: string | null;
};

/**
 * Shared layout for meal plan rows: title, one muted meta line, and the meal
 * time badge. Titles stay a step below the day heading in the Day List.
 */
export const MealPlanCardContent = ({
  title,
  meta,
  mealTag,
}: MealPlanCardContentProps) => {
  const metaLine = meta.filter(Boolean).join(' · ');

  return (
    <View className="w-full flex-row items-center gap-3 py-1.5">
      <View className="flex-1 gap-0.5">
        <Text className="text-lg leading-6 text-foreground" numberOfLines={2}>
          {title}
        </Text>
        {metaLine ? (
          <Text
            className="text-sm leading-5 text-muted-foreground"
            numberOfLines={1}
          >
            {metaLine}
          </Text>
        ) : null}
      </View>
      <MealTagBadge mealTag={mealTag} />
    </View>
  );
};
