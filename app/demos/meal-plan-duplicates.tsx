import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CONFLICT_INDEX_TREATMENTS,
  type ConflictIndexTreatment,
} from '@/components/conflict-review-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { StoreReviewRequest } from '@/features/quantity/app/store-review';
import { StoreReviewSheet } from '@/features/quantity/app/store-review-sheet';

const previewRequest: StoreReviewRequest = {
  changed: false,
  stores: { market: 'Farmers Market', grocery: 'Grocery Store' },
  conflicts: [
    { name: 'Tomatoes', unit: 'lb', quantity: 2, existing: 1 },
    { name: 'Milk', unit: 'gal', quantity: 1, existing: 1 },
    {
      name: 'Extra virgin olive oil',
      unit: 'bottle',
      quantity: 1,
      existing: 2,
    },
  ].map((item, index) => ({
    item: {
      id: `preview-item-${index}`,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      notes: '',
      category: '',
      store: 'market',
    },
    rows: [
      {
        quantity: item.existing,
        row: {
          kind: 'row',
          id: `preview-row-${index}`,
          listId: 'preview',
          name: item.name,
          unit: item.unit,
          notes: '',
          category: '',
          store: 'grocery',
          status: 'active',
          version: 'preview',
        },
      },
    ],
  })),
};

function DuplicateDemoLauncher() {
  const [treatment, setTreatment] =
    useState<ConflictIndexTreatment>('navigation');
  const [single, setSingle] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Button variant="ghost" onPress={() => router.back()}>
          <Text>Back</Text>
        </Button>
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-3xl font-semibold">
            Conflict review preview
          </Text>
          <Text className="text-muted-foreground">
            The app’s conflict screen with sample items. Nothing is saved.
          </Text>
        </View>
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold">
            Overview treatment
          </Text>
          {CONFLICT_INDEX_TREATMENTS.map(item => (
            <Button
              key={item.id}
              variant={treatment === item.id ? 'default' : 'outline'}
              accessibilityState={{ selected: treatment === item.id }}
              onPress={() => setTreatment(item.id)}
            >
              <Text>{item.label}</Text>
            </Button>
          ))}
        </View>
        <View className="gap-3">
          <Button
            variant={!single ? 'secondary' : 'outline'}
            onPress={() => setSingle(false)}
            accessibilityState={{ selected: !single }}
          >
            <Text>Multiple conflicts</Text>
          </Button>
          <Button
            variant={single ? 'secondary' : 'outline'}
            onPress={() => setSingle(true)}
            accessibilityState={{ selected: single }}
          >
            <Text>Single conflict</Text>
          </Button>
        </View>
        <Button onPress={() => setOpen(true)}>
          <Text>Open preview</Text>
        </Button>
      </ScrollView>
      {open ? (
        <StoreReviewSheet
          request={
            single
              ? {
                  ...previewRequest,
                  conflicts: previewRequest.conflicts.slice(0, 1),
                }
              : previewRequest
          }
          indexTreatment={treatment}
          onFinish={() => setOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function MealPlanDuplicatesDemoRoute() {
  if (!__DEV__) return <Redirect href="/(tabs)" />;
  return <DuplicateDemoLauncher />;
}
