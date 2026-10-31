import { Alert } from 'react-native';

import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { MealPlanItemWithStore } from '../types';
import { getMealPlanShoppingState } from '../utils/shopping-state';
import {
  countUncheckedLinkedGroceryItems,
  withUncheckedLinkedGroceryItemsNotice,
} from '../utils/unchecked-linked-grocery-items';

import { MealPlanCardContent } from './meal-plan-card-content';

type MealPlanItemCardProps = {
  mealPlanItem: MealPlanItemWithStore;
  contextMenuEnabled?: boolean;
  onItemPress: (item: MealPlanItemWithStore) => void;
};

const MealPlanItemCard = ({
  mealPlanItem,
  contextMenuEnabled = true,
  onItemPress,
}: MealPlanItemCardProps) => {
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();
  const shoppingState = getMealPlanShoppingState(mealPlanItem);
  const statusLabel = shoppingState.allPurchased ? 'Purchased' : null;

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
    <ListItem>
      <HapticPressable
        key={mealPlanItem.id}
        onPress={() => onItemPress(mealPlanItem)}
        className="flex-1"
      >
        <MealPlanCardContent
          title={mealPlanItem.name}
          meta={[
            formatQuantityUnit(mealPlanItem.quantity, mealPlanItem.unit),
            statusLabel,
          ]}
          mealTag={mealPlanItem.mealTag}
        />
      </HapticPressable>
    </ListItem>
  );

  if (!contextMenuEnabled) return card;

  return (
    <ContextMenuRoot trigger={card}>
      <ContextMenuItem key="delete-item" destructive onSelect={handleDelete}>
        <ContextMenuItemTitle>Delete Item</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

export default MealPlanItemCard;
