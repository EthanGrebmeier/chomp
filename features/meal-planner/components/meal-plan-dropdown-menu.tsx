import { MoreHorizontal } from 'lucide-react-native';
import { Alert } from 'react-native';

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
