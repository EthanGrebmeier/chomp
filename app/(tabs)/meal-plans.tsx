import { Heading } from '@/components/text/heading';
import { MealPlanCard } from '@/features/meal-planner/components/meal-plan-card';
import { useMealPlans } from '@/features/meal-planner/hooks/useMealPlans';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { AddMealPlanSheet } from '../../features/meal-planner/components/add-meal-plan-sheet';

export default function MealPlansPage() {
  const mealPlans = useMealPlans();

  return (
    <View className="py-safe flex-1 gap-2 bg-background">
      <View className="px-4">
        <Heading>Meal Plans</Heading>
      </View>
      <FlatList
        data={mealPlans.data}
        renderItem={({ item }) => (
          <MealPlanCard
            key={item.id}
            mealPlan={item}
            onPress={() => {
              router.push(`/meal-plan/${item.id}`);
            }}
            onDelete={() => {
              // The delete logic is handled inside MealPlanCard
              // This callback can be used for additional cleanup if needed
            }}
          />
        )}
        className="flex-1"
        contentContainerClassName="flex-1"
      />
      <View className="absolute bottom-4 right-4">
        <AddMealPlanSheet />
      </View>
    </View>
  );
}
