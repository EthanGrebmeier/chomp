import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { formatQuantity } from '../model';
import type { Change, Conflict, QuantityState } from '../types';

function describeChange(change: Change, state: QuantityState) {
  const value = change.value;
  if (!value) {
    const previous = state.documents[change.id];
    return `Remove ${previous && 'name' in previous ? previous.name : 'quantity'}`;
  }
  if (value.kind === 'entry')
    return `${value.sourceName || 'Quantity'}: ${formatQuantity(value.quantity)} ${value.unit}`;
  if (value.kind === 'meal')
    return `${value.name}, ${value.date} ${value.mealTag}: ${value.ingredients.map(i => `${i.name} ${i.selected ? `${formatQuantity(i.quantity)} ${i.unit}` : '(deselected)'}`).join(', ')}`;
  if (value.kind === 'row')
    return `${value.name}: ${value.status}, ${value.store || 'No store'}`;
  return value.name;
}

export function ConflictCard({
  conflict,
  state,
  disabled,
  onKeepCurrent,
}: {
  conflict: Conflict;
  state: QuantityState;
  disabled: boolean;
  onKeepCurrent: () => void;
}) {
  return (
    <View className="gap-2 rounded-xl bg-muted p-4">
      <Text className="font-semibold">Review a conflicting change</Text>
      <Text>{conflict.operation.label}</Text>
      <Text className="text-sm text-muted-foreground">{conflict.reason}</Text>
      <Text className="text-sm font-medium">Your saved changes</Text>
      {conflict.operation.changes.map(change => (
        <Text key={change.id} className="text-sm">
          {describeChange(change, state)}
        </Text>
      ))}
      <Text className="text-sm text-muted-foreground">
        Open the item to apply your preferred value. Then dismiss this notice,
        or keep the current result.
      </Text>
      <Button variant="outline" disabled={disabled} onPress={onKeepCurrent}>
        <Text>Keep current result</Text>
      </Button>
    </View>
  );
}
