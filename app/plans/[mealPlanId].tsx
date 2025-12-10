import { useAuth } from '@clerk/clerk-expo';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { useMealPlan } from '@/features/meal-planner/hooks/useMealPlan';

import { BackButton } from '../../components/ui/back-button';

export default function MealPlanDetailPage() {
  const { isSignedIn } = useAuth();
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId!);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in-email" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Heading>Loading meal plan...</Heading>
      </View>
    );
  }

  if (!mealPlan) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Heading>Meal plan not found</Heading>
      </View>
    );
  }

  return (
    <View className="pt-safe flex-1 bg-background">
      <View className="px-4">
        <BackButton />
      </View>
      <MealPlanner mealPlan={mealPlan} />
    </View>
  );
}
