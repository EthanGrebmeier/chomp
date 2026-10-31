import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { SheetConfirmFooter } from '@/components/sheet-confirm-footer';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/ui/close-button';
import { Text } from '@/components/ui/text';

import { parseQuantity } from '../model';

export function AmountSheet({
  quantity,
  unit,
  onSave,
  onRemove,
  onDismiss,
}: {
  quantity?: number;
  unit: string;
  onSave: (value: number) => Promise<void>;
  onRemove?: () => Promise<void>;
  onDismiss: () => void;
}) {
  const ref = useRef<TrueSheet>(null);
  const input = useRef<TextInput>(null);
  const [amount, setAmount] = useState(
    quantity === undefined ? '' : String(quantity)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void ref.current?.present();
  }, []);
  const parsed = parseQuantity(amount);
  const commit = (action: () => Promise<void>) => {
    setBusy(true);
    return Promise.resolve()
      .then(action)
      .then(() => ref.current?.dismiss())
      .catch(e =>
        setError(e instanceof Error ? e.message : 'Could not save quantity')
      )
      .finally(() => setBusy(false));
  };
  return (
    <BottomSheet
      ref={ref}
      onStartOpen={() => input.current?.focus()}
      onDismiss={onDismiss}
      insetAdjustment="never"
      footer={
        <SheetConfirmFooter
          disabled={busy || parsed === null}
          onPress={() => {
            if (parsed !== null) void commit(() => onSave(parsed));
          }}
        />
      }
    >
      <BottomSheet.Header
        title={quantity === undefined ? 'Add quantity' : 'Adjust quantity'}
        closeAction={
          <CloseButton
            onPress={() => {
              void ref.current?.dismiss();
            }}
          />
        }
      />
      <BottomSheet.SheetView className="gap-4">
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Quantity
          </Text>
          <View className="min-h-16 flex-row items-center gap-3 rounded-xl bg-muted px-4 py-3">
            <TextInput
              ref={input}
              accessibilityLabel="Quantity"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              selectTextOnFocus
              className="flex-1 text-3xl font-semibold leading-9 text-foreground"
              style={{ fontVariant: ['tabular-nums'] }}
            />
            <Text className="text-lg text-muted-foreground">{unit}</Text>
          </View>
        </View>
        {error ? (
          <Text accessibilityRole="alert" className="text-destructive">
            {error}
          </Text>
        ) : null}
        {onRemove ? (
          <Button
            variant="ghost"
            disabled={busy}
            onPress={() => {
              void commit(onRemove);
            }}
          >
            <Text className="text-destructive">Remove</Text>
          </Button>
        ) : null}
      </BottomSheet.SheetView>
    </BottomSheet>
  );
}
