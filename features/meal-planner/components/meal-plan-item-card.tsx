import { View } from 'react-native';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { formatQuantity } from '../../../lib/grocery-item';
import { MealPlanItem } from '../types';

type MealPlanItemCardProps = {
  mealPlanItem: MealPlanItem;
  onItemPress: (item: MealPlanItem) => void;
};

const MealPlanItemCard = ({
  mealPlanItem,
  onItemPress,
}: MealPlanItemCardProps) => {
  return (
    <HapticPressable
      key={mealPlanItem.id}
      onPress={() => onItemPress(mealPlanItem)}
    >
      <View className="w-full rounded-xl bg-muted px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-foreground">
            {mealPlanItem.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {formatQuantity({
              quantity: mealPlanItem.quantity,
              unit: mealPlanItem.unit,
            })}
          </Text>
        </View>
      </View>
    </HapticPressable>
  );
};

export default MealPlanItemCard;
