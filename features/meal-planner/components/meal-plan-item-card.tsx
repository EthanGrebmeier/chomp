import { Alert, View } from 'react-native';

import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { isMealPlanOnly } from '../instant/meal-plan-entry';
import { MealPlanItemWithStore } from '../types';
import {
  countUncheckedLinkedGroceryItems,
  withUncheckedLinkedGroceryItemsNotice,
} from '../utils/unchecked-linked-grocery-items';

import { MEAL_PLAN_ONLY_LABEL, MealPlanOnlyLabel } from './meal-plan-only';

type MealPlanItemCardProps = {
  mealPlanItem: MealPlanItemWithStore;
  isLast: boolean;
  contextMenuEnabled?: boolean;
  onItemPress: (item: MealPlanItemWithStore) => void;
};

const MealPlanItemCard = ({
  mealPlanItem,
  isLast,
  contextMenuEnabled = true,
  onItemPress,
}: MealPlanItemCardProps) => {
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();
  const { isMealPlanOnly: mealPlanOnly, setMealPlanOnly } =
    useMealPlanOnlyToggle({
      entry: { type: 'item', id: mealPlanItem.id },
      isMealPlanOnly: isMealPlanOnly(mealPlanItem),
    });

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      withUncheckedLinkedGroceryItemsNotice(
        `Are you sure you want to delete "${mealPlanItem.name}" from your meal plan?`,
        countUncheckedLinkedGroceryItems({ items: [mealPlanItem] })
      ),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            removeItemFromMealPlan({ mealPlanItemId: mealPlanItem.id }),
        },
      ]
    );
  };

  const card = (
    <ListItem
      className={!isLast ? 'border-b border-dashed border-border' : undefined}
    >
      <HapticPressable
        key={mealPlanItem.id}
        onPress={() => onItemPress(mealPlanItem)}
        className="flex-1"
      >
        <View className="w-full py-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-xl font-medium text-foreground">
              {mealPlanItem.name}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {formatQuantityUnit(mealPlanItem.quantity, mealPlanItem.unit)}
            </Text>
          </View>
          {mealPlanOnly ? <MealPlanOnlyLabel /> : null}
        </View>
      </HapticPressable>
    </ListItem>
  );

  if (!contextMenuEnabled) return card;

  return (
    <ContextMenuRoot trigger={card}>
      <ContextMenuItem
        key="toggle-meal-plan-only"
        onSelect={() => setMealPlanOnly(!mealPlanOnly)}
      >
        <ContextMenuItemTitle>
          {mealPlanOnly ? 'Add to list' : MEAL_PLAN_ONLY_LABEL}
        </ContextMenuItemTitle>
      </ContextMenuItem>
      <ContextMenuItem key="delete-item" destructive onSelect={handleDelete}>
        <ContextMenuItemTitle>Delete Item</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanItemCard;
