import { router } from 'expo-router';
import { View } from 'react-native';

import {
  buildMealPlanLinkSentence,
  GroceryItemMealPlanLink,
} from '../../features/grocery-list/meal-plan-link';
import { navigation } from '../../lib/navigation';
import { Text } from '../ui/text';

type MealPlanLinkSentenceProps = {
  link: GroceryItemMealPlanLink;
  listId?: string;
  /** Opens the meal plan view on `date` (`yyyy-MM-dd`). */
  onOpenMealPlanDate?: (date: string) => void;
  /** Called after navigating away, so the sheet can close. */
  onNavigate: () => void;
};

/**
 * "An ingredient of **{recipe}** for **{date}**" / "Planned for **{date}**",
 * styled like `MealScheduleSentence`. The recipe opens the recipe; the date
 * opens that day in the meal plan.
 */
export const MealPlanLinkSentence = ({
  link,
  listId,
  onOpenMealPlanDate,
  onNavigate,
}: MealPlanLinkSentenceProps) => {
  const parts = buildMealPlanLinkSentence(link);

  return (
    <View className="mt-2">
      <Text variant="body" className="text-muted-foreground">
        {parts.map((part, index) => {
          if (part.type === 'text') return part.text;

          const onPress =
            part.type === 'recipe'
              ? () => {
                  router.push(navigation.goToRecipe(part.recipeId, listId));
                  onNavigate();
                }
              : onOpenMealPlanDate
                ? () => {
                    onOpenMealPlanDate(part.date);
                    onNavigate();
                  }
                : undefined;

          return (
            <Text
              key={index}
              accessibilityRole={onPress ? 'link' : undefined}
              className="font-semibold text-foreground underline"
              onPress={onPress}
            >
              {part.text}
            </Text>
          );
        })}
      </Text>
    </View>
  );
};
