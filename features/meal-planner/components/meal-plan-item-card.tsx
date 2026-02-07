import { Alert, View } from 'react-native';

import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { MealPlanItem } from '../types';

type MealPlanItemCardProps = {
  mealPlanItem: MealPlanItem;
  onItemPress: (item: MealPlanItem) => void;
  onIndicatorPress: (mealPlanItem: MealPlanItem) => void;
};

const MealPlanItemCard = ({
  mealPlanItem,
  onItemPress,
  onIndicatorPress,
}: MealPlanItemCardProps) => {
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${mealPlanItem.name}" from your meal plan?`,
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

  return (
    <ContextMenuRoot
      trigger={
        <HapticPressable
          key={mealPlanItem.id}
          onPress={() => onItemPress(mealPlanItem)}
        >
          <View className="w-full flex-row items-center rounded-xl bg-muted px-4 py-3">
            <Checkbox
              checked={!!mealPlanItem.addedToList}
              onPress={() => onIndicatorPress(mealPlanItem)}
              className="mr-3"
            />
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-foreground">
                {mealPlanItem.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {formatQuantityUnit(mealPlanItem.quantity, mealPlanItem.unit)}
              </Text>
            </View>
          </View>
        </HapticPressable>
      }
    >
      <ContextMenuItem key="delete-item" destructive onSelect={handleDelete}>
        <ContextMenuItemTitle>Delete Item</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanItemCard;
