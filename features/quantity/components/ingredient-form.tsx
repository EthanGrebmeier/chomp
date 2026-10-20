import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  ItemNameField,
  ItemNotesField,
} from '@/components/item-sheet/item-fields';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { parseQuantity } from '../model';
import type { Ingredient } from '../types';

import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

export const emptyIngredient = (id: string): Ingredient => ({
  id,
  name: '',
  quantity: 1,
  unit: 'each',
  notes: '',
  category: 'produce',
  store: '',
});

export function IngredientFields({
  value,
  onChange,
}: {
  value: Ingredient;
  onChange: (value: Ingredient) => void;
}) {
  const [amount, setAmount] = useState(String(value.quantity));
  return (
    <View className="gap-3">
      <ItemNameField
        accessibilityLabel="Ingredient name"
        value={value.name}
        onChangeText={name => onChange({ ...value, name })}
      />
      <ItemNotesField
        accessibilityLabel="Ingredient notes"
        value={value.notes}
        onChangeText={notes => onChange({ ...value, notes })}
      />
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-sm text-muted-foreground">Quantity</Text>
          <BottomSheet.TextInput
            accessibilityLabel="Ingredient quantity"
            value={amount}
            keyboardType="decimal-pad"
            onChangeText={text => {
              setAmount(text);
              onChange({ ...value, quantity: parseQuantity(text) ?? NaN });
            }}
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm text-muted-foreground">Unit</Text>
          <BottomSheet.TextInput
            accessibilityLabel="Ingredient unit"
            value={value.unit}
            onChangeText={unit => onChange({ ...value, unit })}
          />
        </View>
      </View>
      <BottomSheet.TextInput
        accessibilityLabel="Ingredient store"
        placeholder="Store (optional)"
        value={value.store}
        onChangeText={store => onChange({ ...value, store })}
      />
      <BottomSheet.TextInput
        accessibilityLabel="Ingredient category"
        placeholder="Category"
        value={value.category}
        onChangeText={category => onChange({ ...value, category })}
      />
    </View>
  );
}

export function AddItemSheet({
  newId,
  onAdd,
  onDismiss,
  planned = false,
}: {
  newId: () => string;
  onAdd: (item: Ingredient) => void;
  onDismiss: () => void;
  planned?: boolean;
}) {
  const sheet = useSheetController(onDismiss);
  const [item, setItem] = useState(() => emptyIngredient(newId()));
  return (
    <Sheet title={planned ? 'Plan an item' : 'Add item'} controller={sheet}>
      <IngredientFields value={item} onChange={setItem} />
      <Button
        disabled={!item.name.trim() || !Number.isFinite(item.quantity)}
        onPress={() => {
          void sheet.dismiss(() => onAdd(item));
        }}
      >
        <Text>{planned ? 'Continue to schedule' : 'Add to list'}</Text>
      </Button>
    </Sheet>
  );
}
