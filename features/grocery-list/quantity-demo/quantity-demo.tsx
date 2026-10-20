import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  ItemNameField,
  ItemNotesField,
} from '@/components/item-sheet/item-fields';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { ContributionSheet } from './contribution-sheet';
import { DemoMetaBar } from './demo-meta-bar';
import { SourceDetails } from './source-details';
import {
  type Contribution,
  type DemoItem,
  contributionSourceDetail,
  formatAmount,
  parseAmount,
  totalAmount,
} from './model';

type ContributionTarget = { kind: 'add' } | { kind: 'edit'; id: string };

export function QuantityDemoSheet({
  item,
  onChange,
  onDismiss,
}: {
  item: DemoItem;
  onChange: (item: DemoItem) => void;
  onDismiss: () => void;
}) {
  const sheetRef = useRef<TrueSheet>(null);
  const counter = useRef(0);
  const [target, setTarget] = useState<ContributionTarget | null>(null);
  const editing =
    target?.kind === 'edit'
      ? item.entries.find(candidate => candidate.id === target.id)
      : undefined;
  const total = totalAmount(item.entries);
  const history = item.status !== 'active';

  useEffect(() => {
    void sheetRef.current?.present();
  }, []);

  const updateAmount = (id: string, amount: string) => {
    onChange({
      ...item,
      entries: item.entries.map(value =>
        value.id === id ? { ...value, amount } : value
      ),
    });
  };

  const remove = (id: string) => {
    onChange({
      ...item,
      entries: item.entries.filter(value => value.id !== id),
    });
  };

  const add = (amount: string) => {
    let id: string;
    do {
      id = `demo-extra-${++counter.current}`;
    } while (item.entries.some(value => value.id === id));
    onChange({
      ...item,
      entries: [
        ...item.entries,
        {
          id,
          label: 'Extra',
          amount,
          origin: 'manual',
        },
      ],
    });
  };

  const openEditor = (id: string) => setTarget({ kind: 'edit', id });

  return (
    <BottomSheet ref={sheetRef} onDismiss={onDismiss}>
      <BottomSheet.SheetView>
        <BottomSheet.Header title="Edit item" />
        <ItemNameField
          accessibilityLabel="Item name"
          value={item.name}
          onChangeText={name => onChange({ ...item, name })}
          editable={!history}
        />
        {history ? (
          <Text className="mt-2 text-sm text-muted-foreground">
            {item.status === 'checked' ? 'Purchased' : 'Deleted'} · Read-only
            history
          </Text>
        ) : null}
        <ItemNotesField
          accessibilityLabel="Shopping notes"
          value={item.note}
          onChangeText={note => onChange({ ...item, note })}
          editable={!history}
        />
        <View className="mb-3 mt-4">
          <View className="min-h-12 flex-row items-center justify-between gap-2 pb-2">
            <View className="flex-1">
              <Text
                accessibilityRole="header"
                className="text-lg font-semibold"
              >
                Quantity
              </Text>
              <Text
                accessibilityLabel={
                  total === null
                    ? 'Total incomplete'
                    : `Total ${formatAmount(total)} ${item.unit}`
                }
                className="text-sm text-muted-foreground"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {total === null
                  ? 'Total incomplete'
                  : `${formatAmount(total)} ${item.unit}`}
              </Text>
            </View>
            {!history ? (
              <Button
                variant="ghost"
                size="icon"
                className="-mr-3 size-12"
                accessibilityLabel="Add quantity"
                onPress={() => setTarget({ kind: 'add' })}
              >
                <Icon as={Plus} size={22} />
              </Button>
            ) : null}
          </View>
          {item.entries.map(contribution => (
            <View key={contribution.id} className="border-b border-border py-2">
              {history ? (
                <View className="min-h-12 flex-row items-center gap-4">
                  <SourceLabel entry={contribution} />
                  <AmountText amount={contribution.amount} unit={item.unit} />
                </View>
              ) : (
                <HapticPressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${contribution.label}${contribution.note ? `, ${contribution.note}` : ''}, ${contributionSourceDetail(contribution)}, ${contribution.amount || 'no amount'} ${item.unit}`}
                  className="min-h-12 flex-row items-center gap-3"
                  onPress={() => openEditor(contribution.id)}
                >
                  <SourceLabel entry={contribution} />
                  <AmountText amount={contribution.amount} unit={item.unit} />
                  <Icon
                    as={ChevronRight}
                    size={18}
                    className="text-muted-foreground"
                  />
                </HapticPressable>
              )}
            </View>
          ))}
        </View>
        <DemoMetaBar item={item} onChange={onChange} />
      </BottomSheet.SheetView>
      {target ? (
        <ContributionSheet
          key={target.kind === 'edit' ? target.id : 'add'}
          entry={editing}
          unit={item.unit}
          itemName={item.name}
          onSave={amount =>
            editing ? updateAmount(editing.id, amount) : add(amount)
          }
          onRemove={() => editing && remove(editing.id)}
          onDismiss={() => setTarget(null)}
        />
      ) : null}
    </BottomSheet>
  );
}

function AmountText({ amount, unit }: { amount: string; unit: string }) {
  const missing = parseAmount(amount) === null;
  return (
    <Text
      className={missing ? 'text-muted-foreground' : 'font-medium'}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {missing ? 'Set amount' : `${amount} ${unit}`}
    </Text>
  );
}

function SourceLabel({ entry }: { entry: Contribution }) {
  return (
    <View className="flex-1 gap-1">
      <Text className="font-medium">{entry.label}</Text>
      {entry.note ? (
        <Text numberOfLines={2} className="text-sm text-foreground">
          {entry.note}
        </Text>
      ) : null}
      <SourceDetails entry={entry} />
    </View>
  );
}
