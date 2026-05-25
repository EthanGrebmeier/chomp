import { id, tx } from '@instantdb/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import {
  BookOpenIcon,
  CalendarIcon,
  SettingsIcon,
} from 'lucide-react-native';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, TextInput as RNTextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import AddItemSheet from '../../../components/item-sheet/add-item/add-item-sheet';
import {
  CategorySheet,
  CategorySheetRef,
} from '../../../components/item-sheet/category-sheet';
import EditItemProvider from '../../../components/item-sheet/edit-item/edit-item-sheet';
import {
  StoreSheet,
  StoreSheetRef,
} from '../../../components/item-sheet/store-sheet';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { db } from '../../../lib/instant';
import { navigation } from '../../../lib/navigation';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '../../grocery-lists/components/select-grocery-list-sheet';
import {
  clearBulkSelection,
  createBulkSelectionState,
  enterBulkSelectionMode,
  exitBulkSelectionMode,
  selectAllVisibleUncheckedItems,
  toggleBulkSelectionItem,
} from '../bulk-selection/controller';
import {
  getBulkDeleteConfirmationCopy,
  runBulkDelete,
} from '../bulk-selection/delete-orchestrator';
import {
  BulkMoveItemForPlanning,
  buildBulkMoveSelectionPayload,
  runBulkMove,
} from '../bulk-selection/move-orchestrator';
import {
  buildBulkCategorySelectionPayload,
  buildBulkStoreSelectionPayload,
  runBulkCategoryUpdate,
  runBulkStoreUpdate,
} from '../bulk-selection/store-category-orchestrator';
import { BulkToolbarActionId } from '../bulk-selection/toolbar';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { addGroceryListItem } from '../instant/add-grocery-list-item';
import { filterActiveItems, useClearGroceryList } from '../instant/clear-list';
import { incrementGroceryListItem } from '../instant/increment-grocery-list-item';
import { BaseGroceryItem, GroceryListItemWithRecipe } from '../types';
import { AddItemConflictSheet } from './add-item-conflict-sheet';
import { BulkSelectionToolbar } from './bulk-selection-toolbar';
import { ClearListConfirmationSheet } from './clear-list-confirmation-sheet';
import { DeleteListConfirmationSheet } from './delete-list-confirmation-sheet';
import {
  EditListNameSheet,
  EditListNameSheetRef,
} from './edit-list-name-sheet';
import { GroceryItemsList } from './grocery-items-list';
import { GroceryListHeader } from './grocery-list-header';
import { ShareListSheet, ShareListSheetRef } from './share-list-sheet';

type GroceryListProps = {
  listId?: string;
  listName?: string;
  joinCode?: string;
  ownerId?: string;
  isShared?: boolean;
  items: GroceryListItemWithRecipe[];
  groupBy: 'category' | 'none' | 'recipe' | 'store';
  sortBy: 'name' | 'recent';
  onViewListsPress?: () => void;
  onDeleteOrLeave: () => void;
  onActiveListChange?: (listId: string) => void;
  activeListChangeVersion?: number;
};

type GroupingBulkAction = {
  type: 'collapse' | 'expand';
  id: number;
};

export const GroceryList = ({
  listId,
  listName,
  joinCode,
  ownerId,
  isShared = false,
  items,
  groupBy: initialGroupBy,
  sortBy: initialSortBy,
  onViewListsPress,
  onDeleteOrLeave,
  onActiveListChange,
  activeListChangeVersion,
}: GroceryListProps) => {
  const shareListSheetRef = useRef<ShareListSheetRef>(null);
  const editListNameSheetRef = useRef<EditListNameSheetRef>(null);
  const { mutate: updateSettings } = useUpdateSettings();
  const { user } = db.useAuth();
  const activeItemIds = filterActiveItems(items);
  const { mutate: clearGroceryList, mutateAsync: clearGroceryListAsync } =
    useClearGroceryList();

  const isOwner = user?.id === ownerId;

  const [conflictItem, setConflictItem] = useState<{
    existingItemId: string;
    newItem: BaseGroceryItem;
  } | null>(null);
  const [groupBy, setGroupBy] = useState<
    'category' | 'none' | 'recipe' | 'store'
  >(initialGroupBy);
  const [sortBy, setSortBy] = useState<'name' | 'recent'>(initialSortBy);
  const [groupingBulkAction, setGroupingBulkAction] =
    useState<GroupingBulkAction | null>(null);
  const [searchQuery] = useState('');
  const [bulkSelectionState, setBulkSelectionState] = useState(() =>
    createBulkSelectionState()
  );
  const standardControlsOpacity = useSharedValue(1);
  const bulkToolbarOpacity = useSharedValue(0);

  const deferredQuery = useDeferredValue(searchQuery.trim());
  const normalizedQuery = deferredQuery.toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;

    return items.filter(item => {
      const name = item.name.toLowerCase();
      const category = item.category?.toLowerCase() ?? '';
      const notes = item.notes?.toLowerCase() ?? '';
      const recipeName = item.recipe?.name?.toLowerCase() ?? '';
      const storeName = item.store?.name?.toLowerCase() ?? '';

      return (
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        notes.includes(normalizedQuery) ||
        recipeName.includes(normalizedQuery) ||
        storeName.includes(normalizedQuery)
      );
    });
  }, [items, normalizedQuery]);

  useEffect(() => {
    if (!bulkSelectionState.isActive) {
      return;
    }

    const activeUncheckedIds = new Set(
      filteredItems.filter(item => !item.isChecked).map(item => item.id)
    );
    const nextSelectedIds = new Set(
      [...bulkSelectionState.selectedItemIds].filter(id =>
        activeUncheckedIds.has(id)
      )
    );

    const selectionUnchanged =
      nextSelectedIds.size === bulkSelectionState.selectedItemIds.size &&
      [...nextSelectedIds].every(id =>
        bulkSelectionState.selectedItemIds.has(id)
      );

    if (selectionUnchanged) {
      return;
    }

    setBulkSelectionState(currentState => ({
      ...currentState,
      selectedItemIds: nextSelectedIds,
    }));
  }, [
    bulkSelectionState.isActive,
    bulkSelectionState.selectedItemIds,
    filteredItems,
  ]);

  useEffect(() => {
    standardControlsOpacity.value = withTiming(
      bulkSelectionState.isActive ? 0 : 1,
      {
        duration: 200,
      }
    );
    bulkToolbarOpacity.value = withTiming(bulkSelectionState.isActive ? 1 : 0, {
      duration: 200,
    });
  }, [bulkSelectionState.isActive, bulkToolbarOpacity, standardControlsOpacity]);

  const standardControlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: standardControlsOpacity.value,
  }));

  const bulkToolbarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bulkToolbarOpacity.value,
  }));

  const addItemConflictSheetRef = useRef<TrueSheet | null>(null);
  const clearListConfirmationSheetRef = useRef<TrueSheet | null>(null);
  const deleteListConfirmationSheetRef = useRef<TrueSheet | null>(null);
  const bulkStoreSheetRef = useRef<StoreSheetRef>(null);
  const bulkCategorySheetRef = useRef<CategorySheetRef>(null);
  const bulkMoveListSheetRef = useRef<SelectGroceryListSheetRef>(null);
  const searchInputRef = useRef<RNTextInput>(null);
  const [bulkStoreSelectionDraft, setBulkStoreSelectionDraft] = useState<{
    selectedItemIds: string[];
    storeId?: string | null;
    storeName?: string;
  } | null>(null);
  const [bulkCategorySelectionDraft, setBulkCategorySelectionDraft] = useState<{
    selectedItemIds: string[];
    category?: string | null;
  } | null>(null);
  const [bulkStoreOpenRequestId, setBulkStoreOpenRequestId] = useState<
    number | undefined
  >(undefined);
  const [bulkCategoryOpenRequestId, setBulkCategoryOpenRequestId] = useState<
    number | undefined
  >(undefined);

  const dismissSearch = () => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleGroupByChange = (
    newGroupBy: 'category' | 'none' | 'recipe' | 'store'
  ) => {
    setGroupBy(newGroupBy);
    updateSettings({ groupBy: newGroupBy });
  };

  const handleSortByChange = (newSortBy: 'name' | 'recent') => {
    setSortBy(newSortBy);
    updateSettings({ sortBy: newSortBy });
  };

  const handleOpenAllGroupings = () => {
    setGroupingBulkAction(previous => ({
      type: 'expand',
      id: (previous?.id ?? 0) + 1,
    }));
  };

  const handleCollapseAllGroupings = () => {
    setGroupingBulkAction(previous => ({
      type: 'collapse',
      id: (previous?.id ?? 0) + 1,
    }));
  };

  const handleIncrementExistingItem = () => {
    if (!conflictItem) return;

    incrementGroceryListItem({
      itemId: conflictItem.existingItemId,
      quantityToAdd: 1,
    });
  };

  const handleCreateSeparateItem = () => {
    if (!conflictItem || !listId) return;

    addGroceryListItem({
      listId,
      item: {
        ...conflictItem.newItem,
        quantity: 1,
        unit: 'each',
      },
    });
  };

  const handleCancelConflict = () => {
    addItemConflictSheetRef.current?.dismiss();
    setConflictItem(null);
  };

  const handleClearListPress = () => {
    clearListConfirmationSheetRef.current?.present();
  };

  const handleConfirmClearList = () => {
    if (!listId) return;
    clearGroceryList({ itemIds: activeItemIds });
  };

  const handleCancelClearList = () => {
    clearListConfirmationSheetRef.current?.dismiss();
  };

  const handleSharePress = () => {
    if (joinCode) {
      shareListSheetRef.current?.present(joinCode);
    }
  };

  const handleDeleteOrLeavePress = () => {
    deleteListConfirmationSheetRef.current?.present();
  };

  const handleConfirmDeleteOrLeave = () => {
    deleteListConfirmationSheetRef.current?.dismiss();
    onDeleteOrLeave();
  };

  const handleCancelDeleteOrLeave = () => {
    deleteListConfirmationSheetRef.current?.dismiss();
  };

  const handleEditNamePress = () => {
    if (listId && listName) {
      editListNameSheetRef.current?.present(listId, listName);
    }
  };

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  const handleOpenRecipes = () => {
    router.push(navigation.goToRecipes(listId));
  };

  const handleOpenMealPlan = () => {
    if (!listId) return;
    router.push(navigation.goToMealPlan(listId));
  };

  const handleEnterBulkSelectionMode = () => {
    setBulkSelectionState(currentState =>
      enterBulkSelectionMode(currentState)
    );
  };

  const handleExitBulkSelectionMode = () => {
    setBulkSelectionState(currentState =>
      exitBulkSelectionMode(currentState)
    );
  };

  const handleSelectAllBulkItems = () => {
    setBulkSelectionState(currentState =>
      selectAllVisibleUncheckedItems(
        currentState,
        filteredItems.map(item => ({
          id: item.id,
          isChecked: Boolean(item.isChecked),
        }))
      )
    );
  };

  const handleClearBulkSelection = () => {
    setBulkSelectionState(currentState => clearBulkSelection(currentState));
  };

  const handleToggleBulkSelectionItem = (itemId: string) => {
    const item = filteredItems.find(candidate => candidate.id === itemId);
    if (!item) {
      return;
    }

    setBulkSelectionState(currentState =>
      toggleBulkSelectionItem(currentState, {
        id: item.id,
        isChecked: Boolean(item.isChecked),
      })
    );
  };

  const handleSelectBulkSectionItems = (itemIds: string[]) => {
    const selectableItemIds = new Set(
      filteredItems
        .filter(item => !item.isChecked)
        .map(item => item.id)
        .filter(id => itemIds.includes(id))
    );

    if (selectableItemIds.size === 0) {
      return;
    }

    setBulkSelectionState(currentState => {
      if (!currentState.isActive) {
        return currentState;
      }

      const nextSelectedItemIds = new Set(currentState.selectedItemIds);
      selectableItemIds.forEach(id => {
        nextSelectedItemIds.add(id);
      });

      return {
        ...currentState,
        selectedItemIds: nextSelectedItemIds,
      };
    });
  };

  const handleDeselectBulkSectionItems = (itemIds: string[]) => {
    if (itemIds.length === 0) {
      return;
    }

    const itemIdSet = new Set(itemIds);

    setBulkSelectionState(currentState => {
      if (!currentState.isActive || currentState.selectedItemIds.size === 0) {
        return currentState;
      }

      const nextSelectedItemIds = new Set(
        [...currentState.selectedItemIds].filter(id => !itemIdSet.has(id))
      );

      if (nextSelectedItemIds.size === currentState.selectedItemIds.size) {
        return currentState;
      }

      return {
        ...currentState,
        selectedItemIds: nextSelectedItemIds,
      };
    });
  };

  const confirmBulkDelete = (selectedCount: number) => {
    const copy = getBulkDeleteConfirmationCopy(selectedCount);

    return new Promise<boolean>(resolve => {
      Alert.alert(copy.title, copy.description, [
        {
          text: copy.cancelLabel,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: copy.confirmLabel,
          style: 'destructive',
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  const handleBulkToolbarActionPress = async (actionId: BulkToolbarActionId) => {
    if (actionId === 'set-store') {
      const selectedItems = filteredItems.filter(item =>
        bulkSelectionState.selectedItemIds.has(item.id)
      );
      const selectedStoreIds = new Set(
        selectedItems.map(item => item.store?.id ?? undefined)
      );
      const resolvedStoreId =
        selectedStoreIds.size === 1 ? [...selectedStoreIds][0] : null;
      const sharedStoreId =
        resolvedStoreId === undefined ? null : resolvedStoreId;
      const sharedStoreName =
        sharedStoreId === null
          ? undefined
          : selectedItems.find(item => item.store?.id === sharedStoreId)?.store
              ?.name;

      setBulkStoreSelectionDraft({
        selectedItemIds: selectedItems.map(item => item.id),
        storeId: sharedStoreId,
        storeName: sharedStoreName,
      });
      bulkStoreSheetRef.current?.present();
      setBulkStoreOpenRequestId(previous => (previous ?? 0) + 1);
      return;
    }

    if (actionId === 'set-category') {
      const selectedItems = filteredItems.filter(item =>
        bulkSelectionState.selectedItemIds.has(item.id)
      );
      const selectedCategories = new Set(
        selectedItems.map(item => item.category ?? undefined)
      );
      const resolvedCategory =
        selectedCategories.size === 1 ? [...selectedCategories][0] : null;
      const sharedCategory =
        resolvedCategory === undefined ? null : resolvedCategory;

      setBulkCategorySelectionDraft({
        selectedItemIds: selectedItems.map(item => item.id),
        category: sharedCategory,
      });
      bulkCategorySheetRef.current?.present();
      setBulkCategoryOpenRequestId(previous => (previous ?? 0) + 1);
      return;
    }

    if (actionId === 'move') {
      bulkMoveListSheetRef.current?.present();
      return;
    }

    if (actionId !== 'delete') {
      return;
    }

    try {
      await runBulkDelete({
        selectedItemIds: bulkSelectionState.selectedItemIds,
        confirmDelete: confirmBulkDelete,
        deleteItems: async itemIds => {
          await clearGroceryListAsync({ itemIds });
        },
        onDeleteSuccess: () => {
          setBulkSelectionState(currentState =>
            exitBulkSelectionMode(currentState)
          );
        },
      });
    } catch {
      toast.error('Failed to delete selected items');
    }
  };

  const handleBulkStoreSheetSelect = async (
    nextStoreId?: string,
    nextStoreName?: string
  ) => {
    const payload = buildBulkStoreSelectionPayload({
      selectedItemIds: bulkSelectionState.selectedItemIds,
      storeId: nextStoreId,
      storeName: nextStoreName,
    });
    if (!payload) {
      return;
    }

    setBulkStoreSelectionDraft(payload);
    const selectedItems = filteredItems.filter(item =>
      payload.selectedItemIds.includes(item.id)
    );
    try {
      await runBulkStoreUpdate({
        selectedItemIds: payload.selectedItemIds,
        selectedItems,
        storeId: payload.storeId,
      });
      setBulkSelectionState(currentState => exitBulkSelectionMode(currentState));
    } catch {
      toast.error('Failed to update store for selected items');
    }
  };

  const handleBulkCategorySheetSelect = async (nextCategory?: string) => {
    const payload = buildBulkCategorySelectionPayload({
      selectedItemIds: bulkSelectionState.selectedItemIds,
      category: nextCategory,
    });
    if (!payload) {
      return;
    }

    setBulkCategorySelectionDraft(payload);
    const selectedItems = filteredItems.filter(item =>
      payload.selectedItemIds.includes(item.id)
    );
    try {
      await runBulkCategoryUpdate({
        selectedItemIds: payload.selectedItemIds,
        selectedItems,
        category: payload.category,
      });
      setBulkSelectionState(currentState => exitBulkSelectionMode(currentState));
    } catch {
      toast.error('Failed to update category for selected items');
    }
  };

  const handleBulkMoveListSelect = async (destinationListId: string) => {
    const moveSelectionPayload = buildBulkMoveSelectionPayload({
      selectedItemIds: bulkSelectionState.selectedItemIds,
      sourceListId: listId,
      destinationListId,
    });

    if (!moveSelectionPayload) {
      return;
    }

    const selectedItems = filteredItems.filter(item =>
      moveSelectionPayload.selectedItemIds.includes(item.id)
    );
    const fetchDestinationItems = async (
      destinationListIdToUse: string
    ): Promise<BulkMoveItemForPlanning[]> => {
      const result = await db.queryOnce({
        grocery_items: {
          grocery_list: {},
          store: {},
          $: {
            where: {
              isDeleted: false,
            },
          },
        },
      });

      return result.data.grocery_items.filter(
        item => item.grocery_list?.id === destinationListIdToUse
      );
    };

    try {
      await runBulkMove({
        moveSelectionPayload,
        selectedItems,
        fetchDestinationItems,
        applyDestinationPlan: async (
          plan,
          destinationListIdToUse,
          destinationItems
        ) => {
          const transactions = [];
          const now = new Date().toISOString();
          const destinationItemsMap = new Map(
            destinationItems.map(item => [item.id, item])
          );

          for (const [
            destinationItemId,
            quantityToAdd,
          ] of plan.quantityUpdates.entries()) {
            const destinationItem = destinationItemsMap.get(destinationItemId);
            if (!destinationItem) {
              continue;
            }

            transactions.push(
              tx.grocery_items[destinationItemId].update(
                trimStringFields({
                  quantity: destinationItem.quantity + quantityToAdd,
                  updatedAt: now,
                })
              )
            );
          }

          for (const createEntry of plan.createEntries) {
            const nextItemId = id();
            transactions.push(
              tx.grocery_items[nextItemId].update(
                trimStringFields({
                  name: createEntry.name,
                  quantity: createEntry.quantity,
                  unit: createEntry.unit,
                  notes: createEntry.notes,
                  category: createEntry.category,
                  isChecked: createEntry.isChecked,
                  isDeleted: false,
                  createdAt: now,
                  updatedAt: now,
                })
              ),
              tx.grocery_items[nextItemId].link({
                grocery_list: destinationListIdToUse,
              })
            );

            if (createEntry.storeId) {
              transactions.push(
                tx.grocery_items[nextItemId].link({
                  store: createEntry.storeId,
                })
              );
            }
          }

          if (transactions.length > 0) {
            await db.transact(transactions);
          }
        },
        removeSourceItems: async itemIds => {
          if (itemIds.length === 0) {
            return;
          }

          const now = new Date().toISOString();
          const transactions = itemIds.map(itemId =>
            tx.grocery_items[itemId].update(
              trimStringFields({
                isDeleted: true,
                deletedAt: now,
                updatedAt: now,
              })
            )
          );

          await db.transact(transactions);
        },
        onMoveSuccess: () => {
          setBulkSelectionState(currentState =>
            exitBulkSelectionMode(currentState)
          );
          onActiveListChange?.(moveSelectionPayload.destinationListId);
        },
      });
    } catch {
      toast.error('Failed to move selected items');
    }
  };

  return (
    <>
      <View
        className="flex-1"
        onStartShouldSetResponderCapture={() => {
          dismissSearch();
          return false;
        }}
      >
        {/** Header */}
        <GroceryListHeader
          listId={listId}
          ownerId={ownerId}
          isShared={isShared}
          items={items}
          listName={listName}
          onClearListPress={handleClearListPress}
          onSharePress={handleSharePress}
          onDeleteOrLeave={handleDeleteOrLeavePress}
          onEditNamePress={handleEditNamePress}
          onViewListsPress={onViewListsPress}
          groupBy={groupBy}
          sortBy={sortBy}
          onGroupByChange={handleGroupByChange}
          onSortByChange={handleSortByChange}
          onOpenAllGroupings={handleOpenAllGroupings}
          onCollapseAllGroupings={handleCollapseAllGroupings}
          isBulkSelectionModeActive={bulkSelectionState.isActive}
          selectedBulkItemCount={bulkSelectionState.selectedItemIds.size}
          onEnterBulkSelectionMode={handleEnterBulkSelectionMode}
          onExitBulkSelectionMode={handleExitBulkSelectionMode}
          onSelectAllBulkItems={handleSelectAllBulkItems}
          onClearBulkSelection={handleClearBulkSelection}
        />
        <EditItemProvider groceryListId={listId ?? ''}>
          <View className="flex-1">
            <GroceryItemsList
              items={filteredItems}
              totalItemCount={items.length}
              groupBy={groupBy}
              sortBy={sortBy}
              collapsedSectionsResetKey={activeListChangeVersion}
              groupingBulkAction={groupingBulkAction}
              onListInteraction={dismissSearch}
              isBulkSelectionModeActive={bulkSelectionState.isActive}
              selectedBulkItemIds={bulkSelectionState.selectedItemIds}
              onToggleBulkSelectionItem={handleToggleBulkSelectionItem}
              onSelectBulkSelectionSectionItems={handleSelectBulkSectionItems}
              onDeselectBulkSelectionSectionItems={
                handleDeselectBulkSectionItems
              }
            />
          </View>
        </EditItemProvider>
        <AddItemConflictSheet
          ref={addItemConflictSheetRef}
          onIncrement={handleIncrementExistingItem}
          onCreateSeparate={handleCreateSeparateItem}
          onCancel={handleCancelConflict}
        />
        <ClearListConfirmationSheet
          ref={clearListConfirmationSheetRef}
          onConfirm={handleConfirmClearList}
          onCancel={handleCancelClearList}
        />
        <DeleteListConfirmationSheet
          ref={deleteListConfirmationSheetRef}
          isOwner={isOwner}
          onConfirm={handleConfirmDeleteOrLeave}
          onCancel={handleCancelDeleteOrLeave}
        />
        <ShareListSheet ref={shareListSheetRef} />
        <EditListNameSheet ref={editListNameSheetRef} />
        <CategorySheet
          ref={bulkCategorySheetRef}
          category={bulkCategorySelectionDraft?.category}
          onSelect={handleBulkCategorySheetSelect}
          hideTrigger
          sheetName="bulk-category-sheet"
          openRequestId={bulkCategoryOpenRequestId}
        />
        <StoreSheet
          ref={bulkStoreSheetRef}
          storeId={bulkStoreSelectionDraft?.storeId}
          storeName={bulkStoreSelectionDraft?.storeName}
          onSelect={handleBulkStoreSheetSelect}
          hideTrigger
          sheetName="bulk-store-sheet"
          openRequestId={bulkStoreOpenRequestId}
        />
        <SelectGroceryListSheet
          ref={bulkMoveListSheetRef}
          selectedListId={listId}
          onSelectList={handleBulkMoveListSelect}
          title="Move to List"
          subtext={`Select a destination for ${bulkSelectionState.selectedItemIds.size} item${bulkSelectionState.selectedItemIds.size === 1 ? '' : 's'}.`}
          showJoinByCode={false}
          showManageActions={false}
          disabledListIds={listId ? [listId] : []}
          name="bulk-move-list-sheet"
        />
      </View>

      <>
        <Animated.View
          className="bottom-safe absolute left-6 z-10"
          style={standardControlsAnimatedStyle}
          pointerEvents={bulkSelectionState.isActive ? 'none' : 'auto'}
        >
          <View className="h-10 flex-row items-center gap-6 overflow-hidden rounded-full border border-border bg-accent/90 px-4 shadow-sm">
            <HapticPressable
              onPress={handleOpenMealPlan}
              className="active:opacity-80"
              hapticType="selection"
              hitSlop={10}
            >
              <Icon
                as={CalendarIcon}
                size={24}
                strokeWidth={2}
                className="text-accent-foreground"
              />
            </HapticPressable>
            <HapticPressable
              onPress={handleOpenRecipes}
              className="gap-2 active:opacity-80"
              hapticType="selection"
              hitSlop={10}
            >
              <Icon
                as={BookOpenIcon}
                size={24}
                strokeWidth={2}
                className="mt-0.5 text-accent-foreground"
              />
            </HapticPressable>
            <HapticPressable
              onPress={handleOpenSettings}
              className="gap-2 active:opacity-80"
              hapticType="selection"
              hitSlop={10}
            >
              <Icon
                as={SettingsIcon}
                size={24}
                strokeWidth={2}
                className="mt-0.5 text-accent-foreground"
              />
            </HapticPressable>
          </View>
        </Animated.View>
        <AddItemSheet
          groceryListId={listId ?? ''}
          isTriggerVisible={!bulkSelectionState.isActive}
        />
        <Animated.View
          className="bottom-safe absolute inset-x-0 z-10 items-center"
          style={bulkToolbarAnimatedStyle}
          pointerEvents={bulkSelectionState.isActive ? 'auto' : 'none'}
        >
          <BulkSelectionToolbar
            selectedItemCount={bulkSelectionState.selectedItemIds.size}
            onActionPress={handleBulkToolbarActionPress}
          />
        </Animated.View>
      </>
    </>
  );
};
