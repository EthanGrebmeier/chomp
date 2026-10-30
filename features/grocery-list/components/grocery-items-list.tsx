import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAppEntryVisible } from '@/lib/startup-screen-ready';

import { FadeSwitch } from '../../../components/animated/fade-switch';
import { useEditItemSheet } from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { useCategoryOptions } from '../../categories/use-category-options';
import {
  createCheckedStateSnapshot,
  createCheckedStateSettler,
  getPresentedCheckedState,
  reconcilePresentedCheckedState,
} from '../checked-state-presentation';
import {
  applyPendingCheckedState,
  usePendingCheckedState,
} from '../pending-checked-state';
import {
  GroceryListGroupBy,
  GroceryListItemWithRecipe,
  GroceryListSortBy,
} from '../types';
import { groupItemsBy, sortItems } from '../util';

import { CollapsibleSectionHeader } from './collapsible-section-header';
import { GroceryListItem } from './grocery-list-item';

type GroceryItemsListProps = {
  items: GroceryListItemWithRecipe[];
  totalItemCount: number;
  onReady?: () => void;
  hideOrganizationTags?: boolean;
  rowPressAction?: 'edit' | 'toggleChecked';
  /** True while the list's items are still being fetched. */
  isLoading?: boolean;
  groupBy: GroceryListGroupBy;
  sortBy: GroceryListSortBy;
  collapsedSectionsResetKey?: string;
  groupingBulkAction?: {
    type: 'collapse' | 'expand';
    id: number;
  } | null;
  scrollsToTop?: boolean;
  onListInteraction?: () => void;
  isBulkSelectionModeActive?: boolean;
  selectedBulkItemIds?: Set<string>;
  onToggleBulkSelectionItem?: (itemId: string) => void;
  onEnterBulkSelectionModeWithItem?: (itemId: string) => void;
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
      categoryValue?: string;
      itemCount?: number;
      isExpanded: boolean;
    }
  | {
      type: 'item';
      sectionKey: string;
      sectionTitle: string;
      item: GroceryListItemWithRecipe;
    };

export const GroceryItemsList = ({
  items: savedItems,
  totalItemCount,
  onReady,
  hideOrganizationTags = false,
  rowPressAction = 'edit',
  isLoading = false,
  groupBy,
  sortBy,
  collapsedSectionsResetKey,
  groupingBulkAction,
  scrollsToTop = true,
  onListInteraction,
  isBulkSelectionModeActive = false,
  selectedBulkItemIds = new Set<string>(),
  onToggleBulkSelectionItem,
  onEnterBulkSelectionModeWithItem,
  onSelectBulkSelectionSectionItems,
  onDeselectBulkSelectionSectionItems,
}: GroceryItemsListProps) => {
  const entryVisible = useAppEntryVisible();
  // Group from tap intent immediately. Waiting for serialized durable writes
  // makes each publication restart the quiet window at an unpredictable time.
  const pendingCheckedState = usePendingCheckedState();
  const items = useMemo(
    () => applyPendingCheckedState(savedItems, pendingCheckedState),
    [savedItems, pendingCheckedState]
  );
  const { present: presentEditSheet } = useEditItemSheet();
  const { data: categoryOptions } = useCategoryOptions();

  const [collapsedSectionsByGroup, setCollapsedSectionsByGroup] = useState<
    Record<GroceryItemsListProps['groupBy'], Set<string>>
  >(createInitialCollapsedSectionsByGroup);
  const [
    appliedCollapsedSectionsResetKey,
    setAppliedCollapsedSectionsResetKey,
  ] = useState(collapsedSectionsResetKey);
  const [appliedBulkActionId, setAppliedBulkActionId] = useState<number | null>(
    null
  );
  const [presentedCheckedState, setPresentedCheckedState] = useState(() =>
    createCheckedStateSnapshot(items)
  );
  const [checkedStateSettler] = useState(() =>
    createCheckedStateSettler(presentedCheckedState, setPresentedCheckedState)
  );

  if (collapsedSectionsResetKey !== appliedCollapsedSectionsResetKey) {
    setAppliedCollapsedSectionsResetKey(collapsedSectionsResetKey);
    setCollapsedSectionsByGroup(createInitialCollapsedSectionsByGroup());
    setAppliedBulkActionId(null);
  }

  const collapsedSections = collapsedSectionsByGroup[groupBy];

  useEffect(() => {
    const nextCheckedState = createCheckedStateSnapshot(items);
    checkedStateSettler.observe(nextCheckedState);

    // Reconcile membership on the next task so observing new props does not
    // synchronously cascade another render.
    const reconcileTimer = setTimeout(() => {
      setPresentedCheckedState(previous =>
        reconcilePresentedCheckedState(previous, nextCheckedState)
      );
    }, 0);
    return () => clearTimeout(reconcileTimer);
  }, [items, checkedStateSettler]);

  useEffect(() => {
    return () => {
      checkedStateSettler.dispose();
    };
  }, [checkedStateSettler]);

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
    const nextUncheckedItems = items.filter(
      item => !getPresentedCheckedState(item, presentedCheckedState)
    );
    const nextCheckedItems = sortItems(
      items.filter(item =>
        getPresentedCheckedState(item, presentedCheckedState)
      ),
      sortBy,
      categoryOptions
    );

    return {
      uncheckedItems: nextUncheckedItems,
      checkedItems: nextCheckedItems,
    };
  }, [categoryOptions, items, presentedCheckedState, sortBy]);

  // Group unchecked items based on selected grouping
  const groupedUncheckedItems = useMemo(
    () => groupItemsBy(uncheckedItems, groupBy, sortBy, categoryOptions),
    [categoryOptions, uncheckedItems, groupBy, sortBy]
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

  if (
    groupingBulkAction != null &&
    groupBy !== 'none' &&
    groupingBulkAction.id !== appliedBulkActionId
  ) {
    setAppliedBulkActionId(groupingBulkAction.id);
    setCollapsedSectionsByGroup(previous => {
      const nextByGroup = { ...previous };
      nextByGroup[groupBy] =
        groupingBulkAction.type === 'expand'
          ? new Set()
          : new Set(groupingSectionKeys);
      return nextByGroup;
    });
  }

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
          categoryValue:
            groupBy === 'category'
              ? (data[0]?.category ?? undefined)
              : undefined,
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
    ({ item }: ListRenderItemInfo<GroceryListRow>) => {
      if (item.type === 'header') {
        return renderSectionHeader(item);
      }

      return (
        <GroceryListItem
          item={item.item}
          hideOrganizationTags={hideOrganizationTags}
          categoryOptions={categoryOptions}
          isChecked={Boolean(item.item.isChecked)}
          rowPressAction={rowPressAction}
          onEdit={rowPressAction === 'edit' ? presentEditSheet : undefined}
          isBulkSelectionModeActive={isBulkSelectionModeActive}
          isBulkSelected={selectedBulkItemIds.has(item.item.id)}
          onToggleBulkSelection={onToggleBulkSelectionItem}
          onEnterBulkSelectionModeWithItem={onEnterBulkSelectionModeWithItem}
        />
      );
    },
    [
      categoryOptions,
      hideOrganizationTags,
      rowPressAction,
      isBulkSelectionModeActive,
      onEnterBulkSelectionModeWithItem,
      onToggleBulkSelectionItem,
      presentEditSheet,
      renderSectionHeader,
      selectedBulkItemIds,
    ]
  );

  const contentState = getContentState({
    isLoading,
    totalItemCount,
    visibleItemCount: items.length,
  });

  // Cross-fade between loading/empty/list states instead of popping, e.g.
  // when items arrive after the skeleton or the last item is removed.
  return (
    <View className="flex-1">
      <FadeSwitch stateKey={contentState} animate={entryVisible}>
        {contentState === 'loading' ? null : contentState === 'empty' ? (
          <View className="flex-1" onLayout={onReady}>
            <EmptyListState />
          </View>
        ) : contentState === 'no-matches' ? (
          <View className="flex-1" onLayout={onReady}>
            <NoMatchesState />
          </View>
        ) : (
          <FlashList
            onLoad={onReady}
            data={listRows.rows}
            renderItem={renderRow}
            keyExtractor={item =>
              item.type === 'header'
                ? `header-${item.sectionKey}`
                : `item-${item.item.id}`
            }
            getItemType={item => item.type}
            drawDistance={300}
            stickyHeaderIndices={listRows.stickyHeaderIndices}
            contentContainerClassName="pb-36"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            scrollsToTop={scrollsToTop}
            onScrollBeginDrag={onListInteraction}
            onTouchStart={onListInteraction}
            maintainVisibleContentPosition={{
              disabled: true,
            }}
          />
        )}
      </FadeSwitch>
    </View>
  );
};

type GroceryItemsListContentState = 'loading' | 'empty' | 'no-matches' | 'list';

const getContentState = ({
  isLoading,
  totalItemCount,
  visibleItemCount,
}: {
  isLoading: boolean;
  totalItemCount: number;
  visibleItemCount: number;
}): GroceryItemsListContentState => {
  if (totalItemCount === 0) {
    // Items for this list haven't arrived yet; don't flash the empty state.
    return isLoading ? 'loading' : 'empty';
  }
  return visibleItemCount === 0 ? 'no-matches' : 'list';
};

const EmptyListState = () => (
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
        <EmptyHeading className="px-4">Your grocery list is empty</EmptyHeading>
        <EmptySubtext className="px-4">
          Add some items to get started!
        </EmptySubtext>
      </View>
    </View>
  </View>
);

const NoMatchesState = () => (
  <View className="flex-1 items-center justify-center px-6">
    <EmptyHeading className="px-4">No matches found</EmptyHeading>
    <EmptySubtext className="px-4">
      Try a different search or clear the filter.
    </EmptySubtext>
  </View>
);
