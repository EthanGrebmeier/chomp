import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useEditItemSheet } from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { cn } from '../../../lib/utils';
import { GroceryListItemWithRecipe } from '../types';
import { groupItemsBy } from '../util';

import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListItem } from './grocery-list-item';

type GroceryItemsListProps = {
  items: GroceryListItemWithRecipe[];
  totalItemCount: number;
  groupBy: 'category' | 'none' | 'recipe' | 'store';
  sortBy: 'name' | 'recent';
  collapsedSectionsResetKey?: number;
  groupingBulkAction?: {
    type: 'collapse' | 'expand';
    id: number;
  } | null;
  onListInteraction?: () => void;
  isBulkSelectionModeActive?: boolean;
  selectedBulkItemIds?: Set<string>;
  onToggleBulkSelectionItem?: (itemId: string) => void;
  onSelectBulkSelectionSectionItems?: (itemIds: string[]) => void;
  onDeselectBulkSelectionSectionItems?: (itemIds: string[]) => void;
};

const createInitialCollapsedSectionsByGroup = (): Record<
  GroceryItemsListProps['groupBy'],
  Set<string>
> => ({
  category: new Set(['checked']),
  none: new Set(['checked']),
  recipe: new Set(['checked']),
  store: new Set(['checked']),
});

type GroceryListRow =
  | {
      type: 'header';
      sectionKey: string;
      title: string;
      itemCount?: number;
      isExpanded: boolean;
    }
  | {
      type: 'item';
      sectionKey: string;
      sectionTitle: string;
      item: GroceryListItemWithRecipe;
      isLastInSection: boolean;
    };

const MEASURED_HEADER_HEIGHT = 52;
const MEASURED_ITEM_HEIGHT = 72;

export const GroceryItemsList = ({
  items,
  totalItemCount,
  groupBy,
  sortBy,
  collapsedSectionsResetKey,
  groupingBulkAction,
  onListInteraction,
  isBulkSelectionModeActive = false,
  selectedBulkItemIds = new Set<string>(),
  onToggleBulkSelectionItem,
  onSelectBulkSelectionSectionItems,
  onDeselectBulkSelectionSectionItems,
}: GroceryItemsListProps) => {
  const { present: presentEditSheet } = useEditItemSheet();

  const [collapsedSectionsByGroup, setCollapsedSectionsByGroup] = useState<
    Record<GroceryItemsListProps['groupBy'], Set<string>>
  >(createInitialCollapsedSectionsByGroup);
  const lastAppliedBulkActionId = useRef<number | null>(null);

  const collapsedSections = collapsedSectionsByGroup[groupBy];

  const toggleSection = useCallback(
    (sectionKey: string) => {
      setCollapsedSectionsByGroup(previous => {
        const nextByGroup = { ...previous };
        const nextCollapsedSections = new Set(nextByGroup[groupBy]);

        if (nextCollapsedSections.has(sectionKey)) {
          nextCollapsedSections.delete(sectionKey);
        } else {
          nextCollapsedSections.add(sectionKey);
        }

        nextByGroup[groupBy] = nextCollapsedSections;
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
      const sectionKey = `group:${sectionTitle}`;
      map.set(
        sectionKey,
        sectionItems.map(item => item.id)
      );
    });
    if (!isBulkSelectionModeActive && checkedItems.length > 0) {
      map.set(
        'checked',
        checkedItems.map(item => item.id)
      );
    }
    return map;
  }, [checkedItems, groupedUncheckedItems, isBulkSelectionModeActive]);

  const sectionItemCounts = useMemo(() => {
    const map = new Map<string, number>();
    groupedUncheckedItems.forEach((sectionItems, sectionTitle) => {
      const sectionKey = `group:${sectionTitle}`;
      map.set(sectionKey, sectionItems.length);
    });
    if (!isBulkSelectionModeActive && checkedItems.length > 0) {
      map.set('checked', checkedItems.length);
    }
    return map;
  }, [checkedItems, groupedUncheckedItems, isBulkSelectionModeActive]);

  const groupingSectionKeys = useMemo(() => {
    const keys = Array.from(groupedUncheckedItems.keys()).map(
      sectionTitle => `group:${sectionTitle}`
    );
    if (!isBulkSelectionModeActive && checkedItems.length > 0) {
      keys.push('checked');
    }
    return keys;
  }, [checkedItems.length, groupedUncheckedItems, isBulkSelectionModeActive]);

  useEffect(() => {
    setCollapsedSectionsByGroup(createInitialCollapsedSectionsByGroup());
    lastAppliedBulkActionId.current = null;
  }, [collapsedSectionsResetKey]);

  useEffect(() => {
    if (!groupingBulkAction || groupBy === 'none') {
      return;
    }
    if (lastAppliedBulkActionId.current === groupingBulkAction.id) {
      return;
    }
    lastAppliedBulkActionId.current = groupingBulkAction.id;

    setCollapsedSectionsByGroup(previous => {
      const nextByGroup = { ...previous };
      nextByGroup[groupBy] =
        groupingBulkAction.type === 'expand'
          ? new Set()
          : new Set(groupingSectionKeys);
      return nextByGroup;
    });
  }, [groupBy, groupingBulkAction, groupingSectionKeys]);

  const listRows = useMemo(() => {
    const rows: GroceryListRow[] = [];
    const stickyHeaderIndices: number[] = [];

    const appendSection = (
      sectionKey: string,
      sectionTitle: string,
      data: GroceryListItemWithRecipe[],
      forceExpanded = false
    ) => {
      const showHeader = !(groupBy === 'none' && !sectionTitle);
      const isExpanded = forceExpanded || !collapsedSections.has(sectionKey);
      const itemCount = sectionItemCounts.get(sectionKey);
      const shouldRenderItems = isExpanded || !showHeader;

      if (showHeader) {
        if (shouldRenderItems) {
          stickyHeaderIndices.push(rows.length);
        }
        rows.push({
          type: 'header',
          sectionKey,
          title: sectionTitle,
          itemCount,
          isExpanded,
        });
      }

      if (!shouldRenderItems) return;

      data.forEach((item, index) => {
        rows.push({
          type: 'item',
          sectionKey,
          sectionTitle,
          item,
          isLastInSection: index === data.length - 1,
        });
      });
    };

    groupedUncheckedItems.forEach((sectionData, sectionTitle) => {
      appendSection(
        `group:${sectionTitle}`,
        sectionTitle,
        sectionData,
        groupBy === 'none'
      );
    });

    if (!isBulkSelectionModeActive && checkedItems.length > 0) {
      appendSection('checked', 'Checked', checkedItems);
    }

    return { rows, stickyHeaderIndices };
  }, [
    checkedItems,
    collapsedSections,
    groupBy,
    groupedUncheckedItems,
    isBulkSelectionModeActive,
    sectionItemCounts,
  ]);

  const handleSelectSectionItems = useCallback(
    (sectionKey: string) => {
      const itemIds = sectionItemIds.get(sectionKey) ?? [];
      if (itemIds.length === 0) {
        return;
      }
      onSelectBulkSelectionSectionItems?.(itemIds);
    },
    [onSelectBulkSelectionSectionItems, sectionItemIds]
  );

  const handleDeselectSectionItems = useCallback(
    (sectionKey: string) => {
      const itemIds = sectionItemIds.get(sectionKey) ?? [];
      if (itemIds.length === 0) {
        return;
      }
      onDeselectBulkSelectionSectionItems?.(itemIds);
    },
    [onDeselectBulkSelectionSectionItems, sectionItemIds]
  );

  const renderSectionHeader = useCallback(
    (row: Extract<GroceryListRow, { type: 'header' }>) => {
      const sectionIds = sectionItemIds.get(row.sectionKey) ?? [];
      const hasSectionItems = sectionIds.length > 0;
      const areAllSectionItemsSelected =
        hasSectionItems && sectionIds.every(id => selectedBulkItemIds.has(id));

      return (
        <CollapsibleSectionHeader
          title={row.title}
          itemCount={row.itemCount}
          isExpanded={row.isExpanded}
          onToggle={() => toggleSection(row.sectionKey)}
          actionLabel={
            isBulkSelectionModeActive && hasSectionItems
              ? areAllSectionItemsSelected
                ? 'Deselect all'
                : 'Select all'
              : undefined
          }
          onActionPress={
            isBulkSelectionModeActive && hasSectionItems
              ? areAllSectionItemsSelected
                ? () => handleDeselectSectionItems(row.sectionKey)
                : () => handleSelectSectionItems(row.sectionKey)
              : undefined
          }
          showCollapse={true}
        />
      );
    },
    [
      handleDeselectSectionItems,
      handleSelectSectionItems,
      isBulkSelectionModeActive,
      sectionItemIds,
      selectedBulkItemIds,
      toggleSection,
    ]
  );

  const renderRow = useCallback(
    ({ item, target }: ListRenderItemInfo<GroceryListRow>) => {
      // FlashList may invoke measurement renders; keep them lightweight.
      if (target === 'Measurement') {
        return (
          <View
            style={{
              height:
                item.type === 'header'
                  ? MEASURED_HEADER_HEIGHT
                  : MEASURED_ITEM_HEIGHT,
            }}
          />
        );
      }

      if (item.type === 'header') {
        return renderSectionHeader(item);
      }

      const showBorder = !item.isLastInSection;
      return (
        <GroceryListItem
          item={item.item}
          isChecked={Boolean(item.item.isChecked)}
          className={cn(showBorder && 'border-b border-dashed border-border')}
          onEdit={presentEditSheet}
          isBulkSelectionModeActive={isBulkSelectionModeActive}
          isBulkSelected={selectedBulkItemIds.has(item.item.id)}
          onToggleBulkSelection={onToggleBulkSelectionItem}
        />
      );
    },
    [
      isBulkSelectionModeActive,
      onToggleBulkSelectionItem,
      presentEditSheet,
      renderSectionHeader,
      selectedBulkItemIds,
    ]
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
    <FlashList
      data={listRows.rows}
      renderItem={renderRow}
      keyExtractor={item =>
        item.type === 'header'
          ? `header-${item.sectionKey}`
          : `item-${item.item.id}`
      }
      getItemType={item => item.type}
      drawDistance={150}
      stickyHeaderIndices={listRows.stickyHeaderIndices}
      contentContainerClassName="pb-36"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={onListInteraction}
      onTouchStart={onListInteraction}
      maintainVisibleContentPosition={{
        disabled: false,
        autoscrollToTopThreshold: 0,
      }}
    />
  );
};
