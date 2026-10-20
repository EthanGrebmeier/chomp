import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Text } from '@/components/ui/text';

import { type Contribution, parseAmount } from './model';

/** Removing these also deselects them from the meal plan. */
function isPlanBacked(entry: Contribution) {
  return entry.origin === 'scheduled' || entry.origin === 'planned';
}

/**
 * Stacked sheet for adding or editing one contribution. Edits are a local
 * draft, committed only through the confirm button (same model as UnitSheet).
 * Omit `entry` to add a new manual contribution.
 */
export function ContributionSheet({
  entry,
  unit,
  itemName,
  onSave,
  onRemove,
  onDismiss,
}: {
  entry?: Contribution;
  unit: string;
  itemName: string;
  onSave: (amount: string) => void;
  onRemove: () => void;
  onDismiss: () => void;
}) {
  const sheetRef = useRef<TrueSheet>(null);
  const inputRef = useRef<TextInput>(null);
  const [amount, setAmount] = useState(entry?.amount ?? '');
  const valid = parseAmount(amount) !== null;

  useEffect(() => {
    void sheetRef.current?.present();
  }, []);

  const dismiss = () => {
    void sheetRef.current?.dismiss();
  };

  const confirm = () => {
    if (!valid) return;
    onSave(amount.trim());
    dismiss();
  };

  const remove = () => {
    if (!entry) return;
    const commit = () => {
      onRemove();
      dismiss();
    };
    if (!isPlanBacked(entry)) {
      commit();
      return;
    }
    Alert.alert(
      `Remove ${entry.label}?`,
      'It will also be deselected from the meal plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: commit },
      ]
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      onOpen={() => inputRef.current?.focus()}
      onDismiss={onDismiss}
      viewClassName="pb-safe"
    >
      <BottomSheet.Header
        className="px-4"
        title={entry ? 'Adjust quantity' : 'Add quantity'}
        dismissButton={<BackButton onPress={dismiss} />}
        button={<ConfirmButton onPress={confirm} disabled={!valid} />}
      />
      <View className="gap-5 px-6 pb-5">
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Quantity
          </Text>
          <View className="min-h-16 flex-row items-center gap-3 rounded-xl bg-muted px-4 py-3">
            <TextInput
              ref={inputRef}
              accessibilityLabel={`Quantity of ${itemName} in ${unit}`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              selectTextOnFocus
              className="flex-1 text-3xl font-semibold leading-9 text-foreground"
              style={{ fontVariant: ['tabular-nums'] }}
            />
            <Text className="text-lg text-muted-foreground">{unit}</Text>
          </View>
        </View>
        {entry ? (
          <Button variant="ghost" className="min-h-12" onPress={remove}>
            <Text className="text-destructive">
              {isPlanBacked(entry) ? 'Remove and deselect from plan' : 'Remove'}
            </Text>
          </Button>
        ) : null}
      </View>
    </BottomSheet>
  );
}
