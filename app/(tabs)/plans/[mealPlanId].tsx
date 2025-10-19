import { Heading } from '@/components/text/heading';
import { MealPlanner } from '@/features/meal-planner/components';
import { useMealPlan } from '@/features/meal-planner/hooks/useMealPlan';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { BackButton } from '../../../components/ui/back-button';

export default function MealPlanDetailPage() {
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data: mealPlan, isLoading } = useMealPlan(mealPlanId!);

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
      <BackButton />
      <MealPlanner
        mealPlanId={mealPlanId!}
        startDate={mealPlan.startDate}
        endDate={mealPlan.endDate}
      />
      <KeyboardToolbar />
    </View>
  );
}
