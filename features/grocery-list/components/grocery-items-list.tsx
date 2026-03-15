import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
} from 'react-native-reanimated';

import { useEditItemSheet } from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { cn } from '../../../lib/utils';
import { useClearGroceryList } from '../instant/clear-list';
import { GroceryListItemWithRecipe } from '../types';
import { groupItemsBy } from '../util';

import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListItem } from './grocery-list-item';

type GroceryItemsListProps = {
  items: GroceryListItemWithRecipe[];
  totalItemCount: number;
  groupBy: 'category' | 'none' | 'recipe' | 'store';
  sortBy: 'name' | 'recent';
  onListInteraction?: () => void;
};

type GroceryListRow =
  | {
      type: 'header';
      title: string;
      itemCount?: number;
      isExpanded: boolean;
    }
  | {
      type: 'item';
      sectionTitle: string;
      item: GroceryListItemWithRecipe;
      isLastInSection: boolean;
    };

export const GroceryItemsList = ({
  items,
  totalItemCount,
  groupBy,
  sortBy,
  onListInteraction,
}: GroceryItemsListProps) => {
  const { present: presentEditSheet } = useEditItemSheet();
  const { mutate: clearGroceryList } = useClearGroceryList();

  const [collapsedSectionsByGroup, setCollapsedSectionsByGroup] = useState<
    Record<GroceryItemsListProps['groupBy'], Set<string>>
  >(() => ({
    category: new Set(['Checked']),
    none: new Set(['Checked']),
    recipe: new Set(['Checked']),
    store: new Set(['Checked']),
  }));

  const collapsedSections = collapsedSectionsByGroup[groupBy];

  const toggleSection = useCallback(
    (sectionTitle: string) => {
      setCollapsedSectionsByGroup(prev => {
        const nextByGroup = { ...prev };
        const next = new Set(nextByGroup[groupBy]);
        if (next.has(sectionTitle)) {
          next.delete(sectionTitle);
        } else {
          next.add(sectionTitle);
        }
        nextByGroup[groupBy] = next;
        return nextByGroup;
      });
    },
    [groupBy]
  );

  const { uncheckedItems, checkedItems } = useMemo(() => {
    const nextUncheckedItems = items.filter(item => !item.isChecked);
    const nextCheckedItems = items.filter(item => item.isChecked);

    nextCheckedItems.sort((a, b) => {
      if (sortBy === 'recent') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }

      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
    });

    return {
      uncheckedItems: nextUncheckedItems,
      checkedItems: nextCheckedItems,
    };
  }, [items, sortBy]);

  // Group unchecked items based on selected grouping
  const groupedUncheckedItems = useMemo(
    () => groupItemsBy(uncheckedItems, groupBy, sortBy),
    [uncheckedItems, groupBy, sortBy]
  );

  const sectionItemIds = useMemo(() => {
    const map = new Map<string, string[]>();
    groupedUncheckedItems.forEach((sectionItems, sectionTitle) => {
      map.set(
        sectionTitle,
        sectionItems.map(item => item.id)
      );
    });
    if (checkedItems.length > 0) {
      map.set(
        'Checked',
        checkedItems.map(item => item.id)
      );
    }
    return map;
  }, [checkedItems, groupedUncheckedItems]);

  const sectionItemCounts = useMemo(() => {
    const map = new Map<string, number>();
    groupedUncheckedItems.forEach((sectionItems, sectionTitle) => {
      map.set(sectionTitle, sectionItems.length);
    });
    if (checkedItems.length > 0) {
      map.set('Checked', checkedItems.length);
    }
    return map;
  }, [checkedItems, groupedUncheckedItems]);

  const listRows = useMemo(() => {
    const rows: GroceryListRow[] = [];
    const stickyHeaderIndices: number[] = [];

    const appendSection = (
      sectionTitle: string,
      data: GroceryListItemWithRecipe[],
      forceExpanded = false
    ) => {
      const showHeader = !(groupBy === 'none' && !sectionTitle);
      const isExpanded = forceExpanded || !collapsedSections.has(sectionTitle);
      const itemCount = sectionItemCounts.get(sectionTitle);
      const shouldRenderItems = isExpanded || !showHeader;

      if (showHeader) {
        stickyHeaderIndices.push(rows.length);
        rows.push({
          type: 'header',
          title: sectionTitle,
          itemCount,
          isExpanded,
        });
      }

      if (!shouldRenderItems) return;

      data.forEach((item, index) => {
        rows.push({
          type: 'item',
          sectionTitle,
          item,
          isLastInSection: index === data.length - 1,
        });
      });
    };

    groupedUncheckedItems.forEach((sectionData, sectionTitle) => {
      appendSection(sectionTitle, sectionData, groupBy === 'none');
    });

    if (checkedItems.length > 0) {
      appendSection('Checked', checkedItems);
    }

    return { rows, stickyHeaderIndices };
  }, [
    checkedItems,
    collapsedSections,
    groupBy,
    groupedUncheckedItems,
    sectionItemCounts,
  ]);

  const handleClearSection = useCallback(
    (sectionTitle: string) => {
      const itemIds = sectionItemIds.get(sectionTitle) ?? [];
      if (itemIds.length === 0) return;

      const sectionLabel = sectionTitle || 'this section';
      Alert.alert(
        'Clear section',
        `Are you sure you want to clear ${sectionLabel}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              clearGroceryList({ itemIds });
            },
          },
        ]
      );
    },
    [clearGroceryList, sectionItemIds]
  );

  const renderSectionHeader = useCallback(
    (row: Extract<GroceryListRow, { type: 'header' }>) => (
      <CollapsibleSectionHeader
        title={row.title}
        itemCount={row.itemCount}
        isExpanded={row.isExpanded}
        onToggle={() => toggleSection(row.title)}
        onClearPress={() => handleClearSection(row.title)}
        showCollapse={true}
      />
    ),
    [handleClearSection, toggleSection]
  );

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<GroceryListRow>) => {
      if (item.type === 'header') {
        return renderSectionHeader(item);
      }

      const showBorder = !item.isLastInSection;
      return (
        <GroceryListItem
          item={item.item}
          isChecked={Boolean(item.item.isChecked)}
          className={cn(showBorder && 'border-b border-dashed border-border')}
          onEdit={() => {
            presentEditSheet(item.item);
          }}
        />
      );
    },
    [presentEditSheet, renderSectionHeader]
  );

  if (totalItemCount === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="-translate-y-12">
          <View className="w-64">
            <Image
              source={require('../../../assets/images/FruitBasket.png')}
              style={{
                width: 'auto',
                height: 180,
              }}
              contentFit="contain"
            />
          </View>
          <View className="mt-4">
            <EmptyHeading className="px-4">
              Your grocery list is empty
            </EmptyHeading>
            <EmptySubtext className="px-4">
              Add some items to get started!
            </EmptySubtext>
          </View>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <EmptyHeading className="px-4">No matches found</EmptyHeading>
        <EmptySubtext className="px-4">
          Try a different search or clear the filter.
        </EmptySubtext>
      </View>
    );
  }

  return (
    <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        key={sortBy + groupBy}
        className="flex-1"
      >
        <FlashList
          data={listRows.rows}
          renderItem={renderRow}
          keyExtractor={item =>
            item.type === 'header' ? `header-${item.title}` : item.item.id
          }
          getItemType={item => item.type}
          drawDistance={300}
          stickyHeaderIndices={listRows.stickyHeaderIndices}
          contentContainerClassName="pb-36"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={onListInteraction}
          onTouchStart={onListInteraction}
        />
      </Animated.View>
    </LayoutAnimationConfig>
  );
};
