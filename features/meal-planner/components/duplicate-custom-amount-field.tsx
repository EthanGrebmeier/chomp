import { TextInput, View } from 'react-native';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';
import {
  formatDemoQuantity,
  parseDemoQuantity,
  type DemoCustomAmount,
} from '@/features/meal-planner/duplicate-resolution/demo-choices';
import { cn } from '@/lib/utils';

/**
 * Total quantity for a combined item whose units can't be added automatically.
 * The input is uncontrolled so partial entries like "1." survive re-renders;
 * `amount.quantity` is null until the text parses to a positive number.
 */
export function DuplicateCustomAmountField({
  amount,
  units,
  stores,
  hint,
  autoFocus,
  disabled,
  onChange,
}: {
  amount: DemoCustomAmount;
  units: string[];
  stores: { id: 'existing' | 'incoming'; label: string }[];
  hint: string;
  autoFocus: boolean;
  disabled: boolean;
  onChange: (amount: DemoCustomAmount) => void;
}) {
  const invalid = amount.quantity === null;
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold">Combined total</Text>
      <View
        className={cn(
          'min-h-12 flex-row items-center gap-3 rounded-xl border border-transparent bg-background px-4',
          invalid && 'border-destructive'
        )}
      >
        <TextInput
          accessibilityLabel="New total amount"
          accessibilityHint={hint}
          defaultValue={
            amount.quantity === null
              ? ''
              : formatDemoQuantity(amount.quantity, '')
          }
          onChangeText={text =>
            onChange({ ...amount, quantity: parseDemoQuantity(text) })
          }
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          selectTextOnFocus
          editable={!disabled}
          placeholder="Amount"
          className="min-h-12 flex-1 text-xl font-semibold text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        />
        {units.length > 1 ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Unit"
            className="flex-row gap-1"
          >
            {units.map(unit => {
              const selected = unit === amount.unit;
              return (
                <HapticPressable
                  key={`${unit}-${selected}`}
                  accessibilityRole="radio"
                  accessibilityLabel={unit || 'No unit'}
                  accessibilityState={{ checked: selected, disabled }}
                  hapticType="selection"
                  disabled={disabled}
                  onPress={() => onChange({ ...amount, unit })}
                  className={cn(
                    'min-h-12 min-w-12 items-center justify-center rounded-lg px-3',
                    selected && 'bg-primary'
                  )}
                >
                  <Text
                    className={cn(
                      'font-semibold text-muted-foreground',
                      selected && 'text-primary-foreground'
                    )}
                  >
                    {unit || 'No unit'}
                  </Text>
                </HapticPressable>
              );
            })}
          </View>
        ) : (
          <Text className="text-lg text-muted-foreground">{amount.unit}</Text>
        )}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        className={cn(
          'text-sm text-muted-foreground',
          invalid && 'text-destructive'
        )}
      >
        {invalid ? 'Enter an amount greater than 0.' : hint}
      </Text>
      {stores.length > 0 ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Store for the combined item"
          className="gap-2 pt-2"
        >
          <Text className="text-sm font-semibold">
            Store for the combined item
          </Text>
          {stores.map(store => {
            const selected = (amount.store ?? 'existing') === store.id;
            return (
              <HapticPressable
                key={`${store.id}-${selected}`}
                accessibilityRole="radio"
                accessibilityLabel={store.label}
                accessibilityState={{ checked: selected, disabled }}
                hapticType="selection"
                disabled={disabled}
                onPress={() => onChange({ ...amount, store: store.id })}
                className={cn(
                  'min-h-12 flex-row items-center gap-3 rounded-xl border border-border px-3 py-2',
                  selected && 'border-primary bg-background'
                )}
              >
                <View className="size-5 items-center justify-center rounded-full border border-muted-foreground">
                  {selected ? (
                    <View className="size-3 rounded-full bg-primary" />
                  ) : null}
                </View>
                <Text className="flex-1">{store.label}</Text>
              </HapticPressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
