import {
  ListChevronsUpDownIcon as ListIcon,
  SquareKanban as MealPlanCalendarIcon,
  MoreHorizontal,
} from 'lucide-react-native';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';

import { useClearMealPlan } from '../hooks/useClearMealPlan';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import { MealPlanViewMode } from '../types';

type MealPlanEntity = {
  id: string;
};

type MealPlanDropdownMenuProps = {
  recipes: MealPlanEntity[];
  items: MealPlanEntity[];
};

export function MealPlanDropdownMenu({
  recipes,
  items,
}: MealPlanDropdownMenuProps) {
  const { mutate: clearMealPlan } = useClearMealPlan();
  const hasMealPlanEntries = recipes.length > 0 || items.length > 0;

  const handleClearMealPlan = () => {
    if (!hasMealPlanEntries) return;

    Alert.alert(
      'Clear Meal Plan',
      'Are you sure you want to remove all meals and items from your meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () =>
            clearMealPlan({
              mealPlanRecipeIds: recipes.map(recipe => recipe.id),
              mealPlanItemIds: items.map(item => item.id),
            }),
        },
      ]
    );
  };

  return (
    <DropdownMenuRoot
      trigger={
        <Icon
          hitSlop={14}
          as={MoreHorizontal}
          size={24}
          accessibilityLabel="Meal plan actions"
        />
      }
    >
      <DropdownMenuContent>
        <DropdownMenuItem
          key="clear-meal-plan"
          destructive
          onSelect={handleClearMealPlan}
          disabled={!hasMealPlanEntries}
        >
          <DropdownMenuItemTitle>Clear Meal Plan</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'xmark.circle' }} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

/**
 * `MealPlanDropdownMenu` wired to the meal plan for a list. Mount this only
 * where the meal plan is already visible so its (deep) query is shared with
 * the planner rather than kept alive by the grocery-list view.
 */
export function MealPlanDropdownMenuForList({ listId }: { listId: string }) {
  const { recipes, items } = useUserMealPlanData(listId);

  return <MealPlanDropdownMenu recipes={recipes} items={items} />;
}

type MealPlanHeaderActionsProps = MealPlanDropdownMenuProps & {
  viewMode: MealPlanViewMode;
  onViewModeChange: (viewMode: MealPlanViewMode) => void;
};

export function MealPlanHeaderActions({
  recipes,
  items,
  viewMode,
  onViewModeChange,
}: MealPlanHeaderActionsProps) {
  const targetViewMode: MealPlanViewMode =
    viewMode === 'calendar' ? 'day-list' : 'calendar';
  const targetViewLabel =
    targetViewMode === 'day-list' ? 'Day List' : 'Calendar';
  const accessibilityLabel = `Switch to ${targetViewLabel} view`;

  return (
    <View className="flex-row items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onPress={() => onViewModeChange(targetViewMode)}
        hitSlop={8}
        accessibilityLabel={accessibilityLabel}
        aria-label={accessibilityLabel}
      >
        <Icon
          as={targetViewMode === 'day-list' ? ListIcon : MealPlanCalendarIcon}
          size={22}
          className="text-foreground"
        />
      </Button>
      <MealPlanDropdownMenu recipes={recipes} items={items} />
    </View>
  );
}

export function MealPlanHeaderActionsForList({
  listId,
  viewMode,
  onViewModeChange,
}: {
  listId: string;
  viewMode: MealPlanViewMode;
  onViewModeChange: (viewMode: MealPlanViewMode) => void;
}) {
  const { recipes, items } = useUserMealPlanData(listId);

  return (
    <MealPlanHeaderActions
      recipes={recipes}
      items={items}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
  );
}
