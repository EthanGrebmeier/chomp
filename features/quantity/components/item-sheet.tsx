import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  ItemNameField,
  ItemNotesField,
} from '@/components/item-sheet/item-fields';
import { SheetBody } from '@/components/sheet-content';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { MetabarMenuTrigger } from '@/components/ui/metabar-menu-trigger';
import { Text } from '@/components/ui/text';

import { entriesFor, record, records, totalFor } from '../model';
import {
  deleteRows,
  editQuantity,
  editShoppingDetails,
  extraQuantity,
  type NewId,
} from '../shopping';
import type { Operation, QuantityState } from '../types';

import { AmountSheet } from './amount-sheet';
import { MetadataBar } from './metadata-bar';
import { QuantitySection } from './quantity-section';
import { ShoppingListDropdown } from './shopping-list-dropdown';

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
    leadingAction?: React.ReactNode;
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
  const ref = useRef<TrueSheet>(null);
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
  const [quantityExpanded, setQuantityExpanded] = useState(
    entries.length === 0
  );
  const needsScroll = quantityExpanded && entries.length > 3;
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
        ? 'This removes the item from your list. It stays in purchased items.'
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
    <ShoppingListDropdown
      lists={availableLists}
      selectedListId={row.listId}
      onSelect={listId => leave(() => onMove(rowId, listId))}
    />
  );
  const itemActions = (
    <DropdownMenuRoot
      trigger={<MetabarMenuTrigger accessibilityLabel="Item actions" />}
    >
      <DropdownMenuContent>
        <DropdownMenuItem key="delete-item" destructive onSelect={remove}>
          <DropdownMenuItemTitle>Delete item</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'trash' }} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
  const content = (
    <SheetBody>
      <BottomSheet.Header title="Edit item" className="mb-2" />
      <View className="gap-1">
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
      </View>
      {history ? (
        <Text className="mt-2 text-sm text-muted-foreground">
          Purchased · Read-only history
        </Text>
      ) : null}
      <QuantitySection
        entries={entries}
        total={totalFor(state, rowId) ?? 0}
        itemName={row.name}
        unit={row.unit}
        history={history}
        expanded={quantityExpanded}
        onToggle={() => setQuantityExpanded(value => !value)}
        onAdd={() => setEditor({ snapshot: state })}
        onSelect={entry =>
          entry.sourceId && entry.mealId
            ? leave(() => onOpenMeal(entry.mealId!, entry.sourceId!))
            : setEditor({ id: entry.id, snapshot: state })
        }
      />
      {history ? (
        <Button variant="ghost" onPress={remove}>
          <Text className="text-destructive">Delete item</Text>
        </Button>
      ) : (
        <View className="flex-row items-center gap-2 pt-4">
          <View className="min-w-0 flex-1">
            {MetadataComponent ? (
              <MetadataComponent
                row={row}
                onChange={saveDetails}
                leadingAction={itemActions}
              >
                {listPill}
              </MetadataComponent>
            ) : (
              <MetadataBar
                leadingAction={itemActions}
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
        </View>
      )}
      {error ? <Text className="pt-3 text-destructive">{error}</Text> : null}
    </SheetBody>
  );
  return (
    <BottomSheet
      ref={ref}
      onDismiss={() => {
        onDismiss();
        navigation.current?.();
      }}
      onStartClose={saveMetadata}
      detents={needsScroll ? [0.9] : undefined}
      scrollable={needsScroll}
    >
      {entries.length > 3 ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEnabled={needsScroll}
        >
          {content}
        </ScrollView>
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
    </BottomSheet>
  );
}
