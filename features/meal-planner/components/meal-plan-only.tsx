import { Switch, View } from 'react-native';

import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

export const MEAL_PLAN_ONLY_LABEL = 'Meal plan only';

type AddToGroceryListSwitchProps = {
  isMealPlanOnly: boolean;
  onMealPlanOnlyChange: (isMealPlanOnly: boolean) => void;
  className?: string;
  disabled?: boolean;
  description?: string;
};

/**
 * "Show on grocery list" switch for adding and editing single meal-plan items. On
 * means at least one linked item is visible, including checked items.
 */
export const AddToGroceryListSwitch = ({
  isMealPlanOnly,
  onMealPlanOnlyChange,
  className,
  disabled = false,
  description,
}: AddToGroceryListSwitchProps) => (
  <View className={cn('gap-2', className)}>
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 text-base text-foreground">
        Show on grocery list
      </Text>
      <Switch
        accessibilityLabel="Show on grocery list"
        value={!isMealPlanOnly}
        onValueChange={value => onMealPlanOnlyChange(!value)}
        disabled={disabled}
      />
    </View>
    {description ? (
      <Text className="text-sm text-muted-foreground">{description}</Text>
    ) : null}
  </View>
);
