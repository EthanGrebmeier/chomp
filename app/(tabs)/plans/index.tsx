import { Heading } from '@/components/text/heading';
import { MealPlanCard } from '@/features/meal-planner/components/meal-plan-card';
import { useMealPlans } from '@/features/meal-planner/hooks/useMealPlans';
import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { CreateMealPlanSheet } from '../../../features/meal-planner/components/create-meal-plan-sheet';
import { useDeleteMealPlan } from '../../../features/meal-planner/hooks/useDeleteMealPlan';

export default function MealPlansPage() {
  const mealPlans = useMealPlans();
  const { mutate: deleteMealPlan } = useDeleteMealPlan();
  return (
    <View className="pt-safe flex-1 bg-background">
      <View className="px-4">
        <Heading>Meal Plans</Heading>
      </View>
      {!mealPlans.isLoading && mealPlans.data && mealPlans.data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No meal plans yet</Text>
        </View>
      ) : (
        <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
          <FlatList
            data={mealPlans.data}
            renderItem={({ item, index }) => (
              <ListItem
                key={item.id}
                onDelete={() => {
                  deleteMealPlan(item.id);
                }}
                className={
                  index !== (mealPlans.data?.length ?? 0) - 1
                    ? 'border-b border-border'
                    : ''
                }
              >
                <MealPlanCard
                  mealPlan={item}
                  onPress={() => {
                    router.push(navigation.goToMealPlan(item.id));
                  }}
                />
              </ListItem>
            )}
          />
        </LayoutAnimationConfig>
      )}

      <View className="absolute bottom-4 right-4">
        <CreateMealPlanSheet />
      </View>
    </View>
  );
}
