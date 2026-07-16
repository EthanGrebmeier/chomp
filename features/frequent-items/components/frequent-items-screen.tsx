import { FlashList } from '@shopify/flash-list';
import { PlusIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { toast } from 'sonner-native';

import { CategoryTag } from '@/components/category-tag';
import { formatQuantityUnit } from '@/components/item-sheet/unit-utils';
import { StoreTag } from '@/components/store-tag';
import { EmptyHeading } from '@/components/text/empty-heading';
import { EmptySubtext } from '@/components/text/empty-subtext';
import { Heading } from '@/components/text/heading';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';
import { useCategoryOptions } from '@/features/categories/use-category-options';
import type { CategoryOption } from '@/features/shared/category/categories';
import { ListItemSkeleton } from '@/features/shared/components/list-item-skeleton';
import { cn } from '@/lib/utils';

import { addGroceryListItem } from '../../grocery-list/instant/add-grocery-list-item';
import { useStores } from '../../stores/instant/use-stores';
import { useFrequentItems } from '../hooks/use-frequent-items';
import {
  FrequentItem,
  normalizeGroceryItemName,
} from '../utils/frequent-items';

type FrequentItemsScreenProps = {
  listId: string;
};

type FrequentItemRowProps = {
  item: FrequentItem;
  categoryOptions: CategoryOption[];
  isLast: boolean;
  onAdd: (item: FrequentItem) => void;
};

const FrequentItemRow = ({
  item,
  categoryOptions,
  isLast,
  onAdd,
}: FrequentItemRowProps) => {
  const notes = item.notes?.trim();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  return (
    <ListItem
      className={cn(
        !isLast ? 'border-b border-dashed border-border' : undefined
      )}
    >
      <HapticPressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.name} to grocery list`}
        className="mr-1 size-5 items-center justify-center rounded-md border border-border"
        hapticType="selection"
        hitSlop={10}
        onPress={() => onAdd(item)}
      >
        <Icon
          as={PlusIcon}
          className="text-accent-foreground"
          size={14}
          strokeWidth={2.5}
        />
      </HapticPressable>

      <HapticPressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.name} to grocery list`}
        className="flex-1 gap-1 py-1"
        hapticType="selection"
        onPress={() => onAdd(item)}
      >
        <View className="flex-row items-center justify-between">
          <Text variant="itemTitle" className="flex-1" style={compactTextStyle}>
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
      </HapticPressable>
    </ListItem>
  );
};

const FrequentItemsSkeleton = () => (
  <View className="flex-1">
    {Array.from({ length: 8 }, (_, index) => (
      <ListItemSkeleton key={index} showBorder={index !== 7} />
    ))}
  </View>
);

export const FrequentItemsScreen = ({ listId }: FrequentItemsScreenProps) => {
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

  const handleAdd = (item: FrequentItem) => {
    if (pendingNamesRef.current.has(item.normalizedName)) {
      return;
    }

    pendingNamesRef.current.add(item.normalizedName);
    setPendingNames(current => {
      const next = new Set(current);
      next.add(item.normalizedName);
      return next;
    });

    setTimeout(() => {
      const persistItem = async () => {
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
            item: {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category ?? undefined,
              notes: item.notes ?? undefined,
              storeId: matchingStore?.id,
            },
          });
        } catch {
          pendingNamesRef.current.delete(item.normalizedName);
          setPendingNames(current => {
            const next = new Set(current);
            next.delete(item.normalizedName);
            return next;
          });
          toast.error(`Couldn't add ${item.name}`);
        }
      };

      void persistItem();
    }, 0);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="gap-1 px-4 pb-3">
        <View className="flex-row items-center gap-2">
          <Heading>Frequent Items</Heading>
        </View>
        <Text variant="caption">
          Your most-added items from the last 90 days.
        </Text>
      </View>

      {isLoading ? (
        <FrequentItemsSkeleton />
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-1 px-6">
          <EmptyHeading>Couldn&apos;t load frequent items</EmptyHeading>
          <EmptySubtext>
            Check your connection, then reopen this sheet.
          </EmptySubtext>
        </View>
      ) : visibleItems.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-1 px-6">
          <EmptyHeading>No frequent items yet</EmptyHeading>
          <EmptySubtext>
            Items added at least twice within 90 days will appear here.
          </EmptySubtext>
        </View>
      ) : (
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="pb-safe"
          data={visibleItems}
          keyExtractor={item => item.normalizedName}
          renderItem={({ item, index }) => (
            <FrequentItemRow
              item={item}
              categoryOptions={categoryOptions}
              isLast={index === visibleItems.length - 1}
              onAdd={handleAdd}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
