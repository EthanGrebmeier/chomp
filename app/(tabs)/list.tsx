import { View } from 'react-native';

import { GroceryList } from '@/features/grocery-list/components/grocery-list';
import { useGroceryItems, useSettings } from '@/features/grocery-list/hooks';

import { Text } from '../../components/ui/text';

export default function List() {
  const { data: items, isLoading: itemsLoading } = useGroceryItems();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  if (itemsLoading || settingsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!items || !settings) return null;

  return (
    <View className="flex-1 bg-background">
      <View className="pt-safe flex-1">
        <GroceryList
          items={items}
          groupBy={settings.groupBy}
          sortBy={settings.sortBy}
        />
      </View>
    </View>
  );
}

