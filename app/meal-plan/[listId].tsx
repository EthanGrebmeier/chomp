import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { MealPlanner } from '@/features/meal-planner/components';

export default function MealPlanSheetRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return (
    <View className="bg-background pt-8" style={{ flex: 1 }}>
      <MealPlanner listId={listId} />
    </View>
  );
}
