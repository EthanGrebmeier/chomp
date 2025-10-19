import { format } from 'date-fns';
import { Pressable } from 'react-native';
import { Text } from '../../../components/ui/text';
import { MealPlan } from '../types';

type MealPlanCardProps = {
  mealPlan: MealPlan;
  onPress: () => void;
};

export const MealPlanCard = ({ mealPlan, onPress }: MealPlanCardProps) => {
  return (
    <Pressable onPress={onPress} className="flex-1 ">
      <Text className="text-lg font-semibold text-foreground">
        {mealPlan.name}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {format(new Date(mealPlan.startDate), 'MMM d')} -{' '}
        {format(new Date(mealPlan.endDate), 'MMM d, yyyy')}
      </Text>
    </Pressable>
  );
};
