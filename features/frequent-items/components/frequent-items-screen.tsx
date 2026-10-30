import { PlusIcon } from 'lucide-react-native';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { CategoryTag } from '@/components/category-tag';
import { formatQuantityUnit } from '@/components/item-sheet/unit-utils';
import { StoreTag } from '@/components/store-tag';
import { EmptyHeading } from '@/components/text/empty-heading';
import { EmptySubtext } from '@/components/text/empty-subtext';
import { Icon } from '@/components/ui/icon';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';
import { useCategoryOptions } from '@/features/categories/use-category-options';
import type { StoreReviewer } from '@/features/quantity/app/store-review';
import { isStoreReviewCancelled } from '@/features/quantity/store-review-cancelled';
import type { CategoryOption } from '@/features/shared/category/categories';
import { ListItemSkeleton } from '@/features/shared/components/list-item-skeleton';

import { addGroceryListItem } from '../../grocery-list/instant/add-grocery-list-item';
import { useStores } from '../../stores/instant/use-stores';
import { useFrequentItems } from '../hooks/use-frequent-items';
import {
  FrequentItem,
  normalizeGroceryItemName,
} from '../utils/frequent-items';

import { RecentItemPressable } from './recent-item-pressable';

type FrequentItemsScreenProps = {
  reviewConflicts?: StoreReviewer;
  listId: string;
};

type FrequentItemRowProps = {
  item: FrequentItem;
  categoryOptions: CategoryOption[];
  onAdd: (item: FrequentItem) => Promise<void>;
};

const FrequentItemRow = memo(function FrequentItemRow({
  item,
  categoryOptions,
  onAdd,
}: FrequentItemRowProps) {
  const notes = item.notes?.trim();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  return (
    <RecentItemPressable
      label={`Add ${item.name} to grocery list`}
      onAdd={() => onAdd(item)}
    >
      <ListItem className="min-h-11 px-8">
        <View className="mr-1 size-5 items-center justify-center rounded-md border border-border">
          <Icon
            as={PlusIcon}
            className="text-accent-foreground"
            size={14}
            strokeWidth={2.5}
          />
        </View>
        <View className="flex-1 gap-1 py-1">
          <View className="flex-row justify-between">
            <Text
              variant="itemTitle"
              className="flex-1 pr-2"
              style={compactTextStyle}
            >
              {item.name}
              {'  '}
              <Text variant="itemMeta" style={compactTextStyle}>
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

          {notes ? (
            <Text variant="itemDescription" style={compactTextStyle}>
              {notes}
            </Text>
          ) : null}

          <View className="flex-row items-center gap-2">
            {item.storeName ? <StoreTag name={item.storeName} /> : null}
            <Text variant="caption" tabularNumbers>
              Added {item.count} times
            </Text>
          </View>
        </View>
      </ListItem>
    </RecentItemPressable>
  );
});

const FrequentItemsSkeleton = () => (
  <View style={{ minHeight: 500 }}>
    {Array.from({ length: 8 }, (_, index) => (
      <ListItemSkeleton key={index} />
    ))}
  </View>
);

export const FrequentItemsScreen = ({
  listId,
  reviewConflicts,
}: FrequentItemsScreenProps) => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { frequentItems, isLoading, error } = useFrequentItems(listId);
  const { data: stores } = useStores();
  const { data: categoryOptions } = useCategoryOptions();
  const [pendingNames, setPendingNames] = useState<Set<string>>(
    () => new Set()
  );
  const pendingNamesRef = useRef(new Set<string>());

  const visibleItems = useMemo(
    () => frequentItems.filter(item => !pendingNames.has(item.normalizedName)),
    [frequentItems, pendingNames]
  );

  const handleAdd = useCallback(
    async (item: FrequentItem) => {
      if (pendingNamesRef.current.has(item.normalizedName)) {
        return;
      }

      pendingNamesRef.current.add(item.normalizedName);
      setPendingNames(current => {
        const next = new Set(current);
        next.add(item.normalizedName);
        return next;
      });

      try {
        const matchingStore =
          stores.find(store => store.id === item.storeId) ??
          stores.find(
            store =>
              !!item.storeName &&
              normalizeGroceryItemName(store.name) ===
                normalizeGroceryItemName(item.storeName)
          );

        await addGroceryListItem({
          listId,
          reviewConflicts,
          item: {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category ?? undefined,
            notes: item.notes ?? undefined,
            storeId: matchingStore?.id,
          },
        });
      } catch (error) {
        pendingNamesRef.current.delete(item.normalizedName);
        setPendingNames(current => {
          const next = new Set(current);
          next.delete(item.normalizedName);
          return next;
        });
        if (!isStoreReviewCancelled(error))
          toast.error(`Couldn't add ${item.name}`);
        throw error;
      }
    },
    [listId, stores, reviewConflicts]
  );

  return (
    <GestureHandlerRootView
      style={{ flex: 1, minHeight: 0, paddingBottom: 24 }}
    >
      {isLoading ? (
        <FrequentItemsSkeleton />
      ) : error ? (
        <View
          style={{ minHeight: 500 }}
          className="items-center justify-center gap-1 px-6"
        >
          <EmptyHeading>Couldn&apos;t load frequent items</EmptyHeading>
          <EmptySubtext>
            Check your connection, then reopen this sheet.
          </EmptySubtext>
        </View>
      ) : visibleItems.length === 0 ? (
        <View
          style={{ minHeight: 500 }}
          className="items-center justify-center gap-1 px-6"
        >
          <EmptyHeading>No frequent items yet</EmptyHeading>
          <EmptySubtext>
            Items added at least twice within 90 days will appear here.
          </EmptySubtext>
        </View>
      ) : (
        // The source is capped at 20 rows. Mount all of them so native layout
        // can close a gap without waiting for virtualized cell measurements.
        <ScrollView
          className="min-h-0 flex-1"
          contentInset={{ bottom: safeAreaBottom + 24 }}
          keyboardShouldPersistTaps="handled"
          scrollIndicatorInsets={{ bottom: safeAreaBottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {visibleItems.map(item => (
            <FrequentItemRow
              key={item.normalizedName}
              item={item}
              categoryOptions={categoryOptions}
              onAdd={handleAdd}
            />
          ))}
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
};
