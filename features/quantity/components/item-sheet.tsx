import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  ArrowUpRight,
  ChevronRight,
  MoreHorizontal,
  Plus,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  ItemNameField,
  ItemNotesField,
} from '@/components/item-sheet/item-fields';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Text } from '@/components/ui/text';

import {
  entriesFor,
  formatQuantity,
  record,
  records,
  totalFor,
} from '../model';
import {
  deleteRows,
  editQuantity,
  editShoppingDetails,
  extraQuantity,
  type NewId,
} from '../shopping';
import type { Operation, QuantityEntry, QuantityState } from '../types';

import { AmountSheet } from './amount-sheet';
import { MetadataBar } from './metadata-bar';
import { MoveItemSheet } from './move-item-sheet';

function sourceDetail(entry: QuantityEntry) {
  if (entry.sourceId)
    return `Planned for ${entry.mealTag.toLowerCase()} on ${new Date(`${entry.sourceDate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  if (entry.origin === 'recipe') return 'Added from recipe';
  if (entry.origin === 'scheduled' || entry.origin === 'planned')
    return 'Purchased from meal plan';
  return 'Added manually';
}

export function ItemSheet({
  state,
  rowId,
  newId,
  send,
  onDismiss,
  onOpenMeal,
  onMove,
  MetadataComponent,
  lists,
}: {
  lists?: { id: string; name: string }[];
  MetadataComponent?: ComponentType<{
    children?: React.ReactNode;
    row: import('../types').ShoppingRow;
    onChange: (
      details: Parameters<typeof editShoppingDetails>[3]
    ) => Promise<void>;
  }>;
  state: QuantityState;
  rowId: string;
  newId: NewId;
  send: (operation: Operation) => Promise<void>;
  onDismiss: () => void;
  onOpenMeal: (mealId: string, sourceId: string) => void;
  onMove: (rowId: string, listId: string) => void;
}) {
  const row = record(state, rowId, 'row');
  const availableLists = lists ?? records(state, 'list');
  const currentList = availableLists.find(list => list.id === row.listId);
  const ref = useRef<TrueSheet>(null);
  const [choosingList, setChoosingList] = useState(false);
  const [editor, setEditor] = useState<{
    id?: string;
    snapshot: QuantityState;
  } | null>(null);
  const [name, setName] = useState(row.name);
  const [notes, setNotes] = useState(row.notes);
  const metadataBase = useRef(row);
  const saving = useRef(false);
  const [error, setError] = useState('');
  const navigation = useRef<(() => void) | null>(null);
  const history = row.status !== 'active';
  const entries = entriesFor(state, row.id);
  useEffect(() => {
    void ref.current?.present();
  }, []);
  const saveDetails = async (
    details: Parameters<typeof editShoppingDetails>[3]
  ) => {
    const baseline = metadataBase.current;
    const op = editShoppingDetails(
      {
        ...state,
        heads: [...new Set([...state.heads, baseline.version])],
        documents: { ...state.documents, [rowId]: baseline },
      },
      newId,
      rowId,
      details
    );
    await send(op);
    metadataBase.current = { ...baseline, ...details, version: op.id };
    setError('');
  };
  const saveMetadata = () => {
    if (saving.current || history) return;
    const baseline = metadataBase.current;
    const details = {
      ...(name !== baseline.name ? { name } : {}),
      ...(notes !== baseline.notes ? { notes } : {}),
    };
    if (!Object.keys(details).length) return;
    saving.current = true;
    void saveDetails(details)
      .catch(e => {
        const message = e instanceof Error ? e.message : 'Could not save';
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        saving.current = false;
      });
  };
  const leave = (action: () => void) => {
    navigation.current = action;
    void ref.current?.dismiss();
  };
  const remove = () =>
    Alert.alert(
      `Delete ${row.name}?`,
      history
        ? 'This clears purchased history without changing the meal plan.'
        : 'All planned ingredients in this item will be deselected from the grocery list. Other quantities will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void send(deleteRows(state, newId, [rowId]))
              .then(() => ref.current?.dismiss())
              .catch(e => setError(String(e)));
          },
        },
      ]
    );
  const listPill = (
    <HapticPressable
      accessibilityRole="button"
      accessibilityLabel={`Choose shopping list, current list: ${currentList?.name ?? 'Shopping list'}`}
      className="min-h-11 justify-center"
      onPress={() => setChoosingList(true)}
    >
      <Pill hasValue>{currentList?.name ?? 'Shopping list'}</Pill>
    </HapticPressable>
  );
  const content = (
    <View className="px-6 pb-5">
      <BottomSheet.Header
        title="Edit item"
        button={
          <DropdownMenuRoot
            trigger={
              <View
                accessibilityRole="button"
                accessibilityLabel="Item actions"
                className="size-11 items-center justify-center"
              >
                <Icon as={MoreHorizontal} size={24} />
              </View>
            }
          >
            <DropdownMenuContent>
              <DropdownMenuItem key="delete-item" destructive onSelect={remove}>
                <DropdownMenuItemTitle>Delete item</DropdownMenuItemTitle>
                <DropdownMenuItemIcon ios={{ name: 'trash' }} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        }
      />
      <ItemNameField
        accessibilityLabel="Item name"
        value={name}
        onChangeText={setName}
        onEndEditing={saveMetadata}
        editable={!history}
      />
      <ItemNotesField
        accessibilityLabel="Shopping notes"
        value={notes}
        onChangeText={setNotes}
        onEndEditing={saveMetadata}
        editable={!history}
      />
      {history ? (
        <Text className="mt-2 text-sm text-muted-foreground">
          Purchased · Read-only history
        </Text>
      ) : null}
      <View className="mb-3 mt-4">
        <View className="min-h-12 flex-row items-center justify-between pb-2">
          <View>
            <Text className="text-lg font-semibold">Quantity</Text>
            <Text
              className="text-sm text-muted-foreground"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatQuantity(totalFor(state, rowId) ?? 0)} {row.unit}
            </Text>
          </View>
          {!history ? (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Add quantity"
              onPress={() => setEditor({ snapshot: state })}
            >
              <Icon as={Plus} size={22} />
            </Button>
          ) : null}
        </View>
        {entries.length === 0 ? (
          <Text className="py-4 text-muted-foreground">
            No quantities. Add one to put this item on your shopping list.
          </Text>
        ) : null}
        {entries.map(entry => (
          <HapticPressable
            key={entry.id}
            disabled={history}
            accessibilityRole="button"
            accessibilityLabel={`${entry.sourceId ? 'Open meal plan for' : 'Adjust quantity for'} ${entry.sourceName || row.name}, ${entry.quantity} ${row.unit}`}
            onPress={() =>
              entry.sourceId && entry.mealId
                ? leave(() => onOpenMeal(entry.mealId!, entry.sourceId!))
                : setEditor({ id: entry.id, snapshot: state })
            }
            className="min-h-16 flex-row items-center gap-3 border-b border-border py-3"
          >
            <View className="flex-1 gap-1">
              <Text className="font-medium">
                {entry.origin === 'manual'
                  ? 'Added Manually'
                  : entry.sourceName || 'Quantity'}
              </Text>
              {entry.origin !== 'manual' && entry.sourceNotes ? (
                <Text className="text-sm">{entry.sourceNotes}</Text>
              ) : null}
              {entry.origin !== 'manual' ? (
                <Text className="text-sm text-muted-foreground">
                  {sourceDetail(entry)}
                </Text>
              ) : null}
            </View>
            <Text
              className="font-medium"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatQuantity(entry.quantity)} {row.unit}
            </Text>
            {!history ? (
              <Icon
                as={entry.sourceId ? ArrowUpRight : ChevronRight}
                size={18}
                className="text-muted-foreground"
              />
            ) : null}
          </HapticPressable>
        ))}
      </View>
      {!history ? (
        <View className="gap-3 pt-2">
          {MetadataComponent ? (
            <MetadataComponent row={row} onChange={saveDetails}>
              {listPill}
            </MetadataComponent>
          ) : (
            <MetadataBar
              category={row.category}
              store={row.store}
              stores={records(state, 'row').map(r => r.store)}
              disabled={history}
              onChange={(field, value) => saveDetails({ [field]: value })}
            >
              {listPill}
            </MetadataBar>
          )}
        </View>
      ) : null}
      {error ? <Text className="pt-3 text-destructive">{error}</Text> : null}
    </View>
  );
  return (
    <BottomSheet
      ref={ref}
      onDismiss={() => {
        onDismiss();
        navigation.current?.();
      }}
      onStartClose={saveMetadata}
      detents={entries.length > 3 ? [0.9] : undefined}
      scrollable={entries.length > 3}
    >
      {entries.length > 3 ? (
        <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView>
      ) : (
        content
      )}
      {editor ? (
        <AmountSheet
          quantity={
            editor.id
              ? record(editor.snapshot, editor.id, 'entry').quantity
              : undefined
          }
          unit={row.unit}
          onSave={value =>
            send(
              editor.id
                ? editQuantity(editor.snapshot, newId, editor.id, value)
                : extraQuantity(editor.snapshot, newId, rowId, value)
            )
          }
          onRemove={
            editor.id
              ? () =>
                  send(editQuantity(editor.snapshot, newId, editor.id!, null))
              : undefined
          }
          onDismiss={() => setEditor(null)}
        />
      ) : null}
      {choosingList ? (
        <MoveItemSheet
          lists={availableLists}
          selectedListId={row.listId}
          onSelect={listId => leave(() => onMove(rowId, listId))}
          onDismiss={() => setChoosingList(false)}
        />
      ) : null}
    </BottomSheet>
  );
}
