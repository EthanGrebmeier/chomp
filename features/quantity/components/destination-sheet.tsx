import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';

import { normalize, totalFor, formatQuantity } from '../model';
import { matchingRows, type Destination } from '../shopping';
import type { Ingredient, QuantityState } from '../types';

import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

export function DestinationSheet({
  state,
  listId,
  ingredients,
  onConfirm,
  onDismiss,
}: {
  state: QuantityState;
  listId: string;
  ingredients: Ingredient[];
  onConfirm: (destinations: Record<string, Destination>) => Promise<void>;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const [choices, setChoices] = useState<Record<string, Destination>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Add to shopping list" controller={sheet}>
      <Text className="text-muted-foreground">
        Keep separate, or add a quantity to a matching item. Different units
        always stay separate.
      </Text>
      {ingredients.map(item => (
        <View key={item.id} className="gap-2 border-b border-border pb-4">
          <Text className="text-lg font-semibold">
            {item.name} · {formatQuantity(item.quantity)} {item.unit}
          </Text>
          <Choice
            selected={!choices[item.id]?.rowId}
            label="Keep separate"
            onPress={() => setChoices({ ...choices, [item.id]: {} })}
          />
          {matchingRows(state, listId, item).map(row => {
            const stores =
              normalize(row.store) === normalize(item.store)
                ? [row.store]
                : [row.store, item.store];
            return stores.map(store => (
              <Choice
                key={`${row.id}:${store}`}
                selected={
                  choices[item.id]?.rowId === row.id &&
                  choices[item.id]?.store === store
                }
                label={`Combine with ${formatQuantity(totalFor(state, row.id) ?? 0)} ${row.unit} · ${store || 'No store'}`}
                onPress={() =>
                  setChoices({
                    ...choices,
                    [item.id]: { rowId: row.id, store },
                  })
                }
              />
            ));
          })}
        </View>
      ))}
      {error ? <Text className="text-destructive">{error}</Text> : null}
      <Button
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void onConfirm(choices)
            .then(() => sheet.dismiss())
            .catch(e => setError(String(e)))
            .finally(() => setBusy(false));
        }}
      >
        <Text>Confirm</Text>
      </Button>
    </Sheet>
  );
}

function Choice({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <HapticPressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-12 flex-row items-center gap-3 rounded-xl px-4 py-3 ${selected ? 'bg-muted' : ''}`}
    >
      <Text>{selected ? '●' : '○'}</Text>
      <Text className="flex-1">{label}</Text>
    </HapticPressable>
  );
}
