import { View } from 'react-native';

import { EmptyHeading } from '@/components/text/empty-heading';
import { EmptySubtext } from '@/components/text/empty-subtext';
import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { useActiveMealPlan } from '@/features/meal-planner/hooks';

import { CreateMealPlan } from '../../features/meal-planner/components/create-meal-plan';
import { NATIVE_TABS_OFFSET } from '../../features/shared/consts';

export default function MealPlansPage() {
  const { data: activeMealPlan } = useActiveMealPlan();

  if (!activeMealPlan) {
    return (
      <View className="pt-safe flex-1 bg-background">
        <View className="px-4">
          <Heading>Meal Plans</Heading>
        </View>
        <View
          style={{ marginTop: -NATIVE_TABS_OFFSET }}
          className="flex-1 items-center justify-center gap-4"
        >
          <View>
            <EmptyHeading>No active meal plan found</EmptyHeading>
            <EmptySubtext>Create a new meal plan to get started!</EmptySubtext>
          </View>
          <CreateMealPlan />
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
