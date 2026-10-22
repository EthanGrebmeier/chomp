import { router } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { MealPlanLinkSentencePart } from '../../features/grocery-list/meal-plan-link';
import { navigation } from '../../lib/navigation';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';

type ItemSourceSentenceProps = {
  parts: MealPlanLinkSentencePart[];
  listId?: string;
  /** Opens the meal plan view on `date` (`yyyy-MM-dd`). */
  onOpenMealPlanDate?: (date: string) => void;
  /** Called after navigating away, so the sheet can close. */
  onNavigate: () => void;
  /** When set, renders an X that unlinks the item from its source. */
  onUnlink?: () => void;
};

/**
 * Where an item came from, e.g. "An ingredient of **{recipe}** for
 * **{date}**", styled like `MealScheduleSentence`. The recipe opens the
 * recipe; the date opens that day in the meal plan.
 */
export const ItemSourceSentence = ({
  parts,
  listId,
  onOpenMealPlanDate,
  onNavigate,
  onUnlink,
}: ItemSourceSentenceProps) => (
  <View className="mt-2 flex-row items-center gap-2">
    <Text variant="body" className="shrink text-muted-foreground">
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
    {onUnlink && (
      <HapticPressable
        onPress={onUnlink}
        hitSlop={8}
        hapticType="light"
        accessibilityRole="button"
        accessibilityLabel="Unlink recipe"
      >
        <Icon as={XIcon} size={16} className="text-muted-foreground" />
      </HapticPressable>
    )}
  </View>
);
