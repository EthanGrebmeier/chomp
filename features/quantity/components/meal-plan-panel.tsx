import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';

import { records } from '../model';
import type { QuantityState } from '../types';

export function MealPlanPanel({
  state,
  listId,
  canEdit,
  onAdd,
  onOpen,
}: {
  state: QuantityState;
  listId?: string;
  canEdit: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
}) {
  const meals = records(state, 'meal')
    .filter(m => m.listId === listId)
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold">Meal plan</Text>
        <Button variant="ghost" disabled={!canEdit} onPress={() => onAdd()}>
          <Text>Plan an item</Text>
        </Button>
      </View>
      {meals.map(meal => (
        <HapticPressable
          key={meal.id}
          disabled={!canEdit}
          accessibilityRole="button"
          className="gap-2 rounded-2xl bg-muted p-4"
          onPress={() => onOpen(meal.id)}
        >
          <Text className="text-sm text-muted-foreground">
            {meal.date} · {meal.mealTag}
          </Text>
          <Text className="text-xl font-semibold">{meal.name} ›</Text>
          <Text className="text-muted-foreground">
            {meal.ingredients.filter(i => i.selected).length} of{' '}
            {meal.ingredients.length} ingredients selected
          </Text>
        </HapticPressable>
      ))}
      {meals.length === 0 ? (
        <Text className="py-8 text-muted-foreground">
          Schedule a recipe from Recipes, or plan an individual item.
        </Text>
      ) : null}
    </>
  );
}
