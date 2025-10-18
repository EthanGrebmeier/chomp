import { format } from 'date-fns';
import { Pressable, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
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
    <Pressable onPress={onPress}>
      <ListItem
        className="px-4 py-2"
        onDelete={onDelete ? handleDelete : undefined}
      >
        <View>
          <Text className="text-lg font-semibold text-foreground">
            {mealPlan.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {format(new Date(mealPlan.startDate), 'MMM d')} -{' '}
            {format(new Date(mealPlan.endDate), 'MMM d, yyyy')}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            Created {format(new Date(mealPlan.createdAt), 'MMM d, yyyy')}
            {mealPlan.groceryListId
              ? ' • Has grocery list'
              : ' • No grocery list'}
          </Text>
        </View>
      </ListItem>
    </Pressable>
  );
};
