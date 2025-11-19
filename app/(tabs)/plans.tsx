import { View } from 'react-native';

import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { useActiveMealPlan } from '@/features/meal-planner/hooks';

import { Text } from '../../components/ui/text';
import { CreateMealPlanSheet } from '../../features/meal-planner/components/create-meal-plan-sheet';

export default function MealPlansPage() {
  const { data: activeMealPlan, isLoading } = useActiveMealPlan();

  if (!activeMealPlan) {
    return (
      <View className="pt-safe flex-1 bg-background">
        <View className="px-4">
          <Heading>Meal Plans</Heading>
        </View>
        <View className="flex-1 items-center justify-center gap-4">
          <View>
            <Text className="text-center text-xl font-medium text-muted-foreground">
              No active meal plan found
            </Text>
            <Text className="text-center font-medium text-foreground">
              Create a new meal plan to get started!
            </Text>
          </View>
          <CreateMealPlanSheet />
        </View>
      </View>
    );
  }

  return (
    <View className="pt-safe flex-1 bg-background">
      <MealPlanner key={activeMealPlan.id} mealPlan={activeMealPlan} />
    </View>
  );
}
