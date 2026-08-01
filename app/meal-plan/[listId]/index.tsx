import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { MealPlanner } from '@/features/meal-planner/components';

export default function MealPlanRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return (
    <View className="flex-1 bg-background pt-6">
      <MealPlanner listId={listId} />
    </View>
  );
}
