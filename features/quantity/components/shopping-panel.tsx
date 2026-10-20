import { id } from '@instantdb/react-native';
import { Check, Circle, Plus } from 'lucide-react-native';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { entriesFor, formatQuantity, records, totalFor } from '../model';
import { checkRow, deleteRows } from '../shopping';
import type { Operation, QuantityState } from '../types';

export function ShoppingPanel({
  state,
  listId,
  canEdit,
  act,
  onAdd,
  onOpen,
}: {
  state: QuantityState;
  listId?: string;
  canEdit: boolean;
  act: (action: () => Operation) => void;
  onAdd: () => void;
  onOpen: (id: string) => void;
}) {
  const rows = records(state, 'row').filter(
    r => r.listId === listId && r.status !== 'deleted'
  );
  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold">Shopping list</Text>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canEdit}
          accessibilityLabel="Add grocery item"
          onPress={() => onAdd()}
        >
          <Icon as={Plus} />
        </Button>
      </View>
      {rows
        .filter(r => r.status === 'active')
        .map(row => (
          <View
            key={row.id}
            className="flex-row items-center border-b border-border py-2"
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={!canEdit}
              accessibilityLabel={`Purchase ${row.name}`}
              onPress={() => act(() => checkRow(state, id, row.id))}
            >
              <Icon as={Circle} size={22} className="text-muted-foreground" />
            </Button>
            <HapticPressable
              disabled={!canEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${row.name}`}
              className="min-h-16 flex-1 flex-row items-center gap-3 pl-2"
              onPress={() => onOpen(row.id)}
            >
              <View className="flex-1 gap-1">
                <Text className="text-lg font-medium">{row.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {row.store || 'No store'} · {entriesFor(state, row.id).length}{' '}
                  quantities
                </Text>
              </View>
              <Text
                className="font-medium"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {state.complete
                  ? formatQuantity(totalFor(state, row.id)!)
                  : '…'}{' '}
                {row.unit} ›
              </Text>
            </HapticPressable>
          </View>
        ))}
      {!rows.some(r => r.status === 'active') ? (
        <Text className="py-8 text-muted-foreground">
          Your list is ready for groceries. Add an item or send ingredients from
          Recipes.
        </Text>
      ) : null}
      {rows.some(r => r.status === 'checked') ? (
        <>
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold">Purchased</Text>
            <Button
              variant="ghost"
              disabled={!canEdit}
              onPress={() =>
                Alert.alert(
                  'Clear purchased history?',
                  'The meal plan will stay unchanged.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () =>
                        act(() =>
                          deleteRows(
                            state,
                            id,
                            rows
                              .filter(r => r.status === 'checked')
                              .map(r => r.id)
                          )
                        ),
                    },
                  ]
                )
              }
            >
              <Text>Clear</Text>
            </Button>
          </View>
          {rows
            .filter(r => r.status === 'checked')
            .map(row => (
              <HapticPressable
                key={row.id}
                disabled={!canEdit}
                accessibilityRole="button"
                onPress={() => onOpen(row.id)}
                className="min-h-16 flex-row items-center gap-3 border-b border-border py-3"
              >
                <Icon as={Check} size={20} className="text-muted-foreground" />
                <Text className="flex-1 text-muted-foreground">{row.name}</Text>
                <Text className="text-muted-foreground">
                  {formatQuantity(totalFor(state, row.id) ?? 0)} {row.unit} ›
                </Text>
              </HapticPressable>
            ))}
        </>
      ) : null}
    </>
  );
}
