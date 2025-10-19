import { Heading } from '@/components/text/heading';
import { MealPlanCard } from '@/features/meal-planner/components/meal-plan-card';
import { useMealPlans } from '@/features/meal-planner/hooks/useMealPlans';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { CreateMealPlanSheet } from '../../../features/meal-planner/components/create-meal-plan-sheet';
import { useDeleteMealPlan } from '../../../features/meal-planner/hooks/useDeleteMealPlan';

export default function MealPlansPage() {
  const mealPlans = useMealPlans();
  const { mutate: deleteMealPlan } = useDeleteMealPlan();
  return (
    <View className="py-safe flex-1 bg-background">
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
            <ListItem
              key={item.id}
              onDelete={() => {
                deleteMealPlan(item.id);
              }}
            >
              <MealPlanCard
                mealPlan={item}
                onPress={() => {
                  router.push(`/plans/${item.id}`);
                }}
              />
            </ListItem>
          )}
        />
      )}

      <View className="absolute bottom-4 right-4">
        <CreateMealPlanSheet />
      </View>
    </View>
  );
}
