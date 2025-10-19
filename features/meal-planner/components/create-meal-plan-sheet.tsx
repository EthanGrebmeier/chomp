import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCreateMealPlan } from '../hooks';

export const CreateMealPlanSheet = () => {
  const createMealPlan = useCreateMealPlan();

  const getDefaultName = (date: Date) => {
    return `Week of ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  const handleCreateMealPlan = () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // 7 days from today

    // Create the meal plan without a grocery list
    createMealPlan.mutate({
      mealPlan: {
        name: getDefaultName(today),
        startDate,
        endDate,
      },
    });
  };

  return (
    <Button onPress={handleCreateMealPlan} disabled={createMealPlan.isPending}>
      <Text>
        {createMealPlan.isPending ? 'Creating...' : 'Create Meal Plan'}
      </Text>
    </Button>
  );
};
