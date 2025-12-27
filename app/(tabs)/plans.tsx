import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmptyHeading } from '@/components/text/empty-heading';
import { EmptySubtext } from '@/components/text/empty-subtext';
import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { MealPlannerSkeleton } from '@/features/meal-planner/components/meal-planner-skeleton';
import { useActiveMealPlan } from '@/features/meal-planner/hooks';

import { CreateMealPlan } from '../../features/meal-planner/components/create-meal-plan';
import { NATIVE_TABS_OFFSET } from '../../features/shared/consts';

export default function MealPlansPage() {
  const { data: activeMealPlan, isLoading } = useActiveMealPlan();

  if (!activeMealPlan && !isLoading) {
    return null;
  }

  return (
    <View className="pt-safe flex-1 bg-background">
      {isLoading ? (
        <Animated.View
          key="skeleton"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <MealPlannerSkeleton />
        </Animated.View>
      ) : !activeMealPlan ? (
        <Animated.View
          key="empty"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <View className="px-4">
            <Heading>Meal Plans</Heading>
          </View>
          <View
            style={{ marginTop: -NATIVE_TABS_OFFSET }}
            className="flex-1 items-center justify-center gap-4"
          >
            <View>
              <EmptyHeading>No active meal plan found</EmptyHeading>
              <EmptySubtext>
                Create a new meal plan to get started!
              </EmptySubtext>
            </View>
            <CreateMealPlan />
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key="content"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <MealPlanner key={activeMealPlan.id} mealPlan={activeMealPlan} />
        </Animated.View>
      )}
    </View>
  );
}
