import { View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type ListView = 'grocery-list' | 'meal-plan';

type ListViewTabsProps = {
  activeView: ListView;
  onViewChange: (view: ListView) => void;
  isMealPlanDisabled?: boolean;
  hasUnaddedMeals?: boolean;
};

export function ListViewTabs({
  activeView,
  onViewChange,
  isMealPlanDisabled = false,
  hasUnaddedMeals = false,
}: ListViewTabsProps) {
  return (
    <View
      className="h-12 flex-row items-center gap-6 px-4"
      accessibilityRole="tablist"
    >
      <HapticPressable
        className="h-11 justify-center"
        onPress={() => onViewChange('grocery-list')}
        hapticType="selection"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeView === 'grocery-list' }}
      >
        <Text
          className={cn(
            'text-base font-semibold',
            activeView === 'grocery-list'
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          Grocery List
        </Text>
      </HapticPressable>
      <HapticPressable
        className="h-11 flex-row items-center gap-1.5"
        onPress={() => onViewChange('meal-plan')}
        hapticType="selection"
        disabled={isMealPlanDisabled}
        accessibilityRole="tab"
        accessibilityLabel={
          hasUnaddedMeals
            ? 'Meal Plan, has meals not added to the list'
            : 'Meal Plan'
        }
        accessibilityState={{
          disabled: isMealPlanDisabled,
          selected: activeView === 'meal-plan',
        }}
      >
        <Text
          className={cn(
            'text-base font-semibold',
            isMealPlanDisabled
              ? 'text-muted-foreground/50'
              : activeView === 'meal-plan'
                ? 'text-foreground'
                : 'text-muted-foreground'
          )}
        >
          Meal Plan
        </Text>
        {hasUnaddedMeals ? (
          <View
            className="size-2 rounded-full bg-primary"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
      </HapticPressable>
    </View>
  );
}
