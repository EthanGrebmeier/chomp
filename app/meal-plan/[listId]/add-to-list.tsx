import { useLocalSearchParams } from 'expo-router';

import { AddMealsToListConfirmation } from '@/features/meal-planner/components/add-meals-to-list-confirmation';

export default function AddMealsToListRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return <AddMealsToListConfirmation listId={listId} />;
}
