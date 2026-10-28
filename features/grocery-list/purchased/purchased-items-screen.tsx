import { Check, Plus, Receipt } from 'lucide-react-native';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { toast } from 'sonner-native';

import { CategoryTag } from '@/components/category-tag';
import { formatQuantityUnit } from '@/components/item-sheet/unit-utils';
import { StoreTag } from '@/components/store-tag';
import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';
import { useCategoryOptions } from '@/features/categories/use-category-options';
import { useQuantityList } from '@/features/quantity/app/session';
import type { CategoryOption } from '@/features/shared/category/categories';
import { db } from '@/lib/instant';

import { GroceryListHeader } from '../components/grocery-list-header';
import { addGroceryListItem } from '../instant/add-grocery-list-item';

import { groupPurchases, purchasedItems, type PurchasedItem } from './history';

export function PurchasedItemsScreen({
  listId,
  listName,
  onBack,
}: {
  listId: string;
  listName?: string;
  onBack: () => void;
}) {
  const quantity = useQuantityList(listId);
  const { data: categoryOptions } = useCategoryOptions();
  const stores = db.useQuery({ stores: {} });
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<Set<string>>(() => new Set());
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const pending = useRef(new Set<string>());
  const items = useMemo(
    () => purchasedItems(quantity.state, stores.data?.stores),
    [quantity.state, stores.data]
  );
  const sections = useMemo(() => groupPurchases(items, query), [items, query]);

  const addAgain = useCallback(
    async (item: PurchasedItem) => {
      if (pending.current.has(item.id)) return;
      pending.current.add(item.id);
      setAdding(previous => new Set(previous).add(item.id));
      try {
        await addGroceryListItem({
          listId,
          item: {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
            category: item.category,
            storeId: item.storeName ? item.storeId : undefined,
          },
        });
        setAdded(previous => new Set(previous).add(item.id));
        toast.success(`${item.name} added to list`);
      } catch {
        toast.error(`Could not add ${item.name}. Try again.`);
      } finally {
        pending.current.delete(item.id);
        setAdding(previous => {
          const next = new Set(previous);
          next.delete(item.id);
          return next;
        });
      }
    },
    [listId]
  );

  return (
    <View className="flex-1 bg-background">
      <GroceryListHeader listName="Purchased items" onBackPress={onBack} />
      <View className="gap-4 px-4 pb-4 pt-2">
        {listName ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {listName}
          </Text>
        ) : null}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search items or stores"
          accessibilityLabel="Search purchased items"
          returnKeyType="search"
          autoCorrect={false}
          clearable={false}
        />
        {query ? (
          <Button
            variant="ghost"
            className="min-h-11 self-start"
            onPress={() => setQuery('')}
          >
            <Text>Clear search</Text>
          </Button>
        ) : null}
      </View>
      {quantity.error ? (
        <View className="px-6 py-12">
          <Text
            accessibilityRole="alert"
            className="text-center text-destructive"
          >
            Could not load purchased items. Check your connection and reopen
            this view.
          </Text>
        </View>
      ) : quantity.loading ? (
        <ActivityIndicator
          className="mt-12"
          accessibilityLabel="Loading purchased items"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          extraData={{ adding, added, canEdit: quantity.canEdit }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled
          contentInsetAdjustmentBehavior="automatic"
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center justify-between bg-background px-4 pb-2 pt-4">
              <Text accessibilityRole="header" className="flex-1 font-semibold">
                {section.title}
              </Text>
              <Text className="ml-3 text-sm tabular-nums text-muted-foreground">
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <PurchaseRow
              item={item}
              categoryOptions={categoryOptions}
              adding={adding.has(item.id)}
              added={added.has(item.id)}
              disabled={!quantity.canEdit}
              onAdd={addAgain}
            />
          )}
          ListFooterComponent={<View className="h-8" />}
          ListEmptyComponent={
            <View className="items-center gap-3 px-8 py-16">
              <Icon as={Receipt} size={36} className="text-muted-foreground" />
              <Text className="text-center text-xl font-semibold">
                {items.length ? 'No matching purchases' : 'No purchases yet'}
              </Text>
              <Text className="text-center text-muted-foreground">
                {items.length
                  ? 'Try another item or store.'
                  : 'Check off items on your list to start your history.'}
              </Text>
              {!items.length ? (
                <Button variant="secondary" className="mt-3" onPress={onBack}>
                  <Text>Back to list</Text>
                </Button>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const PurchaseRow = memo(function PurchaseRow({
  item,
  categoryOptions,
  adding,
  added,
  disabled,
  onAdd,
}: {
  item: PurchasedItem;
  categoryOptions: CategoryOption[];
  adding: boolean;
  added: boolean;
  disabled: boolean;
  onAdd: (item: PurchasedItem) => void;
}) {
  return (
    <ListItem>
      <HapticPressable
        accessibilityRole="button"
        accessibilityLabel={
          added ? `${item.name} added to list` : `Add ${item.name} again`
        }
        accessibilityState={{
          disabled: disabled || adding || added,
          busy: adding,
        }}
        disabled={disabled || adding || added}
        onPress={() => onAdd(item)}
        hapticType="selection"
        className="min-h-11 flex-1 flex-row items-center gap-3 py-1"
      >
        <View className="size-5 items-center justify-center rounded-md border border-border">
          {adding ? (
            <ActivityIndicator size="small" />
          ) : (
            <Icon
              as={added ? Check : Plus}
              size={14}
              strokeWidth={2.5}
              className="text-accent-foreground"
            />
          )}
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row justify-between gap-2">
            <Text variant="itemTitle" className="flex-1">
              {item.name}
              {'  '}
              <Text variant="itemMeta">
                {formatQuantityUnit(item.quantity, item.unit)}
              </Text>
            </Text>
            {item.category ? (
              <CategoryTag
                category={item.category}
                categoryOptions={categoryOptions}
              />
            ) : null}
          </View>
          {item.notes?.trim() ? (
            <Text variant="itemDescription" numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
          {item.storeName ? <StoreTag name={item.storeName} /> : null}
        </View>
      </HapticPressable>
    </ListItem>
  );
});
