import { format } from 'date-fns';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useMealPlans } from '../hooks';

export const MealPlanList = () => {
  const { data: mealPlans, isLoading } = useMealPlans();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading meal plans...</Text>
      </View>
    );
  }

  if (!mealPlans || mealPlans.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">No meal plans yet</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Animated.FlatList
        data={mealPlans}
        contentContainerClassName="pb-20"
        itemLayoutAnimation={LinearTransition}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: mealPlan }) => (
          <ListItem key={mealPlan.id} className="mb-2 p-4">
            <View>
              <Text className="text-lg font-semibold text-foreground">
                {mealPlan.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {format(new Date(mealPlan.startDate), 'MMM d')} -{' '}
                {format(new Date(mealPlan.endDate), 'MMM d, yyyy')}
              </Text>
            </View>
          </ListItem>
        )}
      />
    </View>
  );
};
