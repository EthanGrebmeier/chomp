import { Heading } from '@/components/text/heading';
import { MealPlanCard } from '@/features/meal-planner/components/meal-plan-card';
import { useMealPlans } from '@/features/meal-planner/hooks/useMealPlans';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Text } from '../../components/ui/text';
import { AddMealPlanSheet } from '../../features/meal-planner/components/add-meal-plan-sheet';

export default function MealPlansPage() {
  const mealPlans = useMealPlans();

  return (
    <View className="py-safe flex-1 gap-2 bg-background">
      <View className="px-4">
        <Heading>Meal Plans</Heading>
      </View>
      {!mealPlans.isLoading && mealPlans.data && mealPlans.data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No meal plans yet</Text>
        </View>
      ) : (
        <FlatList
          data={mealPlans.data}
          renderItem={({ item }) => (
            <MealPlanCard
              key={item.id}
              mealPlan={item}
              onPress={() => {
                router.push(`/meal-plan/${item.id}`);
              }}
            />
          )}
        />
      )}

      <View className="absolute bottom-4 right-4">
        <AddMealPlanSheet />
      </View>
    </View>
  );
}
