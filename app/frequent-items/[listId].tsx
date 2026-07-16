import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { FrequentItemsScreen } from '@/features/frequent-items/components/frequent-items-screen';

export default function FrequentItemsSheetRoute() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  if (!listId) {
    return null;
  }

  return (
    <View className="flex-1 bg-background pt-6">
      <FrequentItemsScreen listId={listId} />
    </View>
  );
}
