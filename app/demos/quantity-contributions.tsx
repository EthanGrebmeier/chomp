import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';
import {
  createDemoItems,
  formatAmount,
  totalAmount,
} from '@/features/grocery-list/quantity-demo/model';
import { QuantityDemoSheet } from '@/features/grocery-list/quantity-demo/quantity-demo';

function QuantityDemoLauncher() {
  // Development deep links make item previews reproducible for screenshots.
  const params = useLocalSearchParams<{ item?: string }>();
  const [items, setItems] = useState(createDemoItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    params.item ?? null
  );
  const selected = items.find(item => item.id === selectedId);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Button
          variant="ghost"
          className="min-h-12 self-start"
          onPress={() => router.back()}
        >
          <Text>Back to Settings</Text>
        </Button>
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-3xl font-semibold">
            Quantity contributions
          </Text>
          <Text className="text-sm font-semibold">
            Simulated data · Development only · Nothing is saved
          </Text>
          <Text className="text-muted-foreground">
            Open an item to inspect its contributions. Tap a row to edit its
            quantity in a separate sheet. Changes stay in this demo until reset
            or until you leave the route.
          </Text>
        </View>
        {(['active', 'checked', 'deleted'] as const).map(status => (
          <View key={status} className="gap-2">
            <Text accessibilityRole="header" className="text-lg font-semibold">
              {status === 'active'
                ? 'Shopping list'
                : status === 'checked'
                  ? 'Purchased history'
                  : 'Deleted history'}
            </Text>
            {items
              .filter(item => item.status === status)
              .map(item => {
                const total = totalAmount(item.entries);
                return (
                  <HapticPressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedId(item.id)}
                    className="min-h-16 flex-row items-center justify-between gap-4 border-b border-border py-3"
                  >
                    <View className="flex-1 gap-1">
                      <Text className="font-medium">{item.name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {item.store} · {item.entries.length}{' '}
                        {item.entries.length === 1 ? 'entry' : 'entries'}
                      </Text>
                    </View>
                    <Text style={{ fontVariant: ['tabular-nums'] }}>
                      {total === null
                        ? 'Needs amount'
                        : `${formatAmount(total)} ${item.unit}`}{' '}
                      ›
                    </Text>
                  </HapticPressable>
                );
              })}
          </View>
        ))}
        <Text className="text-sm text-muted-foreground">
          Apples in each and grams stay separate. History is read-only. Empty
          amounts are not silently counted as zero.
        </Text>
        <Button
          variant="outline"
          className="min-h-12"
          onPress={() => {
            setSelectedId(null);
            setItems(createDemoItems());
          }}
        >
          <Text>Reset simulated data</Text>
        </Button>
      </ScrollView>
      {selected ? (
        <QuantityDemoSheet
          key={selected.id}
          item={selected}
          onChange={updated =>
            setItems(current =>
              current.map(item => (item.id === updated.id ? updated : item))
            )
          }
          onDismiss={() => setSelectedId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function QuantityContributionsDemoRoute() {
  if (!__DEV__) return <Redirect href="/(tabs)" />;
  return <QuantityDemoLauncher />;
}
