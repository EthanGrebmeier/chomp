import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { DraxProvider } from 'react-native-drax';

import { MealPlanner } from '@/features/meal-planner/components';

export default function MealPlanSheetRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return (
    <View className="bg-background pt-6" style={{ flex: 1 }}>
      <DraxProvider>
        <MealPlanner listId={listId} />
      </DraxProvider>
    </View>
  );
}
