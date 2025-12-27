import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { MealPlannerSkeleton } from '@/features/meal-planner/components/meal-planner-skeleton';
import { useMealPlan } from '@/features/meal-planner/hooks/useMealPlan';

import { BackButton } from '../../components/ui/back-button';

export default function MealPlanDetailPage() {
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId!);

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
      ) : !mealPlan ? (
        <Animated.View
          key="not-found"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <View className="px-4">
            <BackButton />
          </View>
          <View className="flex-1 items-center justify-center">
            <Heading>Meal plan not found</Heading>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key="content"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <View className="px-4">
            <BackButton />
          </View>
          <MealPlanner mealPlan={mealPlan} />
        </Animated.View>
      )}
    </View>
  );
}
