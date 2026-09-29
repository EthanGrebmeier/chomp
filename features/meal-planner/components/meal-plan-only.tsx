import { Switch, View } from 'react-native';

import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

export const MEAL_PLAN_ONLY_LABEL = 'Meal plan only';

/** Muted marker on meal plan cards whose entry is kept off the grocery list. */
export const MealPlanOnlyLabel = ({ className }: { className?: string }) => (
  <Text
    className={cn('text-sm text-muted-foreground', className)}
    numberOfLines={1}
  >
    {MEAL_PLAN_ONLY_LABEL}
  </Text>
);

type AddToGroceryListSwitchProps = {
  isMealPlanOnly: boolean;
  onMealPlanOnlyChange: (isMealPlanOnly: boolean) => void;
  className?: string;
};

/**
 * "Add to grocery list" switch for the Edit Meal and Edit Item sheets. On
 * means the entry's ingredients are live-synced to the grocery list.
 */
export const AddToGroceryListSwitch = ({
  isMealPlanOnly,
  onMealPlanOnlyChange,
  className,
}: AddToGroceryListSwitchProps) => (
  <View
    className={cn('flex-row items-center justify-between gap-3', className)}
  >
    <Text className="flex-1 text-base text-foreground">
      Add to grocery list
    </Text>
    <Switch
      accessibilityLabel="Add to grocery list"
      value={!isMealPlanOnly}
      onValueChange={value => onMealPlanOnlyChange(!value)}
    />
  </View>
);
