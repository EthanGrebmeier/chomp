import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  DuplicateResolutionDemo,
  type DuplicateDemoVariant,
} from '@/features/meal-planner/components/duplicate-resolution-demo';
import { DUPLICATE_DEMO_SCENARIOS } from '@/features/meal-planner/duplicate-resolution/demo-fixtures';

function DuplicateDemoLauncher() {
  const [variant, setVariant] = useState<DuplicateDemoVariant>('compact');
  const [scenarioId, setScenarioId] = useState('mixed');
  const [session, setSession] = useState<number | null>(null);
  const [sessionCounter, setSessionCounter] = useState(0);
  const scenario = DUPLICATE_DEMO_SCENARIOS.find(
    item => item.id === scenarioId
  )!;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View className="gap-3">
          <Button
            variant="ghost"
            className="h-auto min-h-12 self-start py-3"
            onPress={() => router.back()}
          >
            <Text>Back to Settings</Text>
          </Button>
          <Text accessibilityRole="header" className="text-3xl font-semibold">
            Duplicate resolution demo
          </Text>
          <Text className="text-muted-foreground">
            Duplicate ingredients start with a default choice. Confirm from the
            overview, or open an item to combine, pick a store, or keep it
            separate.
          </Text>
          <Text className="text-sm font-semibold">
            Development only · All data is local · Nothing is saved
          </Text>
        </View>
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold">
            Choose a variation
          </Text>
          {(['compact', 'detailed'] as const).map(item => (
            <Button
              key={item}
              variant={variant === item ? 'default' : 'outline'}
              className="h-auto min-h-12 py-3"
              accessibilityState={{ selected: variant === item }}
              onPress={() => setVariant(item)}
            >
              <Text className="text-center">
                {item === 'compact'
                  ? 'Compact bottom sheet'
                  : 'Detailed comparison'}
              </Text>
            </Button>
          ))}
        </View>
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold">
            Choose a scenario
          </Text>
          {DUPLICATE_DEMO_SCENARIOS.map(item => (
            <Button
              key={item.id}
              variant={scenarioId === item.id ? 'secondary' : 'outline'}
              className="h-auto min-h-12 py-3"
              accessibilityState={{ selected: scenarioId === item.id }}
              onPress={() => setScenarioId(item.id)}
            >
              <Text className="text-center">{item.label}</Text>
            </Button>
          ))}
          <Text className="text-sm text-muted-foreground">
            {scenario.description}
          </Text>
        </View>
        <Button
          className="h-auto min-h-12 py-3"
          onPress={() => {
            setSessionCounter(value => value + 1);
            setSession(sessionCounter + 1);
          }}
        >
          <Text>Open demo</Text>
        </Button>
        <Button
          variant="ghost"
          className="h-auto min-h-12 py-3"
          onPress={() => {
            setVariant('compact');
            setScenarioId('mixed');
            setSession(null);
          }}
        >
          <Text>Reset demo</Text>
        </Button>
      </ScrollView>
      {session !== null ? (
        <DuplicateResolutionDemo
          key={session}
          scenario={scenario}
          variant={variant}
          onDismiss={() => setSession(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function MealPlanDuplicatesDemoRoute() {
  if (!__DEV__) return <Redirect href="/(tabs)" />;
  return <DuplicateDemoLauncher />;
}
