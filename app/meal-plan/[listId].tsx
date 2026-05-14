import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { MealPlanner } from '@/features/meal-planner/components';
import { MealPlannerViewMode } from '@/features/meal-planner/lib/view-mode-preference';

export default function MealPlanSheetRoute() {
  const { listId, initialView } = useLocalSearchParams<{
    listId?: string;
    initialView?: string;
  }>();
  const initialViewMode: MealPlannerViewMode | undefined =
    initialView === 'list' || initialView === 'calendar'
      ? initialView
      : undefined;

  if (!listId) {
    return null;
  }

  return (
    <View className="bg-background pt-6" style={{ flex: 1 }}>
      <MealPlanner listId={listId} initialViewMode={initialViewMode} />
    </View>
  );
}
