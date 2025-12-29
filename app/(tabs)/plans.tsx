import { View } from 'react-native';

import { MealPlanner } from '@/features/meal-planner/components';

export default function MealPlansPage() {
  return (
    <View className="pt-safe flex-1 bg-background">
      <MealPlanner />
    </View>
  );
}
