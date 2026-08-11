import { Redirect, useLocalSearchParams } from 'expo-router';

import { navigation } from '@/lib/navigation';

export default function AddMealsToListRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return <Redirect href={navigation.goToMealPlan(listId)} withAnchor />;
}
