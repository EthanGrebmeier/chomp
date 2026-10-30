import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { GroceryItemsList } from '../components/grocery-items-list';
import type { GroceryListItemWithRecipe } from '../types';

const EXPAND_CHECKED_ITEMS = { type: 'expand', id: 0 } as const;

export function ShoppingComplete({
  items,
  onChooseStore,
}: {
  items: GroceryListItemWithRecipe[];
  onChooseStore: () => void;
}) {
  const [showCheckedItems, setShowCheckedItems] = useState(false);

  if (showCheckedItems) {
    return (
      <View className="flex-1">
        <Button
          variant="ghost"
          className="mx-4 mb-3 h-auto min-h-11 self-center px-5 py-3"
          onPress={() => setShowCheckedItems(false)}
        >
          <Text>Hide checked items</Text>
        </Button>
        <GroceryItemsList
          items={items}
          totalItemCount={items.length}
          groupBy="category"
          sortBy="name"
          rowPressAction="toggleChecked"
          hideOrganizationTags
          groupingBulkAction={EXPAND_CHECKED_ITEMS}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow items-center justify-center px-8 py-12"
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-sm items-center">
        <View className="mb-8 size-24 items-center justify-center rounded-full bg-primary/10">
          <Icon
            as={Check}
            size={44}
            strokeWidth={2.5}
            className="text-primary"
          />
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="text-center text-3xl font-semibold"
        >
          Everything checked
        </Text>
        <Text className="mt-3 text-center text-lg text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'} checked off
        </Text>
        <View className="mt-10 w-full gap-3">
          <BottomActionButton onPress={onChooseStore}>
            <Text className="text-center">Choose another store</Text>
          </BottomActionButton>
          <BottomActionButton
            variant="ghost"
            onPress={() => setShowCheckedItems(true)}
          >
            <Text className="text-center">View checked items</Text>
          </BottomActionButton>
        </View>
      </View>
    </ScrollView>
  );
}
