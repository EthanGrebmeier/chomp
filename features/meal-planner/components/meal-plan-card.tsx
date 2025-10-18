import { format } from 'date-fns';
import { Pressable } from 'react-native';
import { Text } from '../../../components/ui/text';
import { useDeleteMealPlan } from '../hooks';
import { MealPlan } from '../types';

type MealPlanCardProps = {
  mealPlan: MealPlan;
  onPress: () => void;
  onDelete?: () => void;
};

export const MealPlanCard = ({
  mealPlan,
  onPress,
  onDelete,
}: MealPlanCardProps) => {
  const deleteMealPlan = useDeleteMealPlan();

  const handleDelete = async () => {
    try {
      await deleteMealPlan.mutateAsync(mealPlan.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
    }
  };

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
