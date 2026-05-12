import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import {
  ArrowRightLeft,
  BookOpenIcon,
  CalendarIcon,
  SettingsIcon,
  Store,
  Tags,
  Trash2,
} from 'lucide-react-native';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, TextInput as RNTextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import AddItemSheet from '../../../components/item-sheet/add-item/add-item-sheet';
import EditItemProvider from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { db } from '../../../lib/instant';
import { navigation } from '../../../lib/navigation';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { getBulkToolbarActions } from '../bulk-selection/toolbar';
import {
  clearBulkSelection,
  createBulkSelectionState,
  enterBulkSelectionMode,
  exitBulkSelectionMode,
  selectAllVisibleUncheckedItems,
  toggleBulkSelectionItem,
} from '../bulk-selection/controller';
import { addGroceryListItem } from '../instant/add-grocery-list-item';
import { filterActiveItems, useClearGroceryList } from '../instant/clear-list';
import { incrementGroceryListItem } from '../instant/increment-grocery-list-item';
import { BaseGroceryItem, GroceryListItemWithRecipe } from '../types';

import { AddItemConflictSheet } from './add-item-conflict-sheet';
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
}: GroceryListProps) => {
  const shareListSheetRef = useRef<ShareListSheetRef>(null);
  const editListNameSheetRef = useRef<EditListNameSheetRef>(null);
  const { mutate: updateSettings } = useUpdateSettings();
  const { user } = db.useAuth();
  const activeItemIds = filterActiveItems(items);
  const { mutate: clearGroceryList } = useClearGroceryList();

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
  const searchInputRef = useRef<RNTextInput>(null);

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

  const bulkToolbarActions = getBulkToolbarActions(
    bulkSelectionState.selectedItemIds.size
  );
  const bulkToolbarIcons = {
    'set-store': Store,
    'set-category': Tags,
    move: ArrowRightLeft,
    delete: Trash2,
  } as const;

  const handleBulkToolbarActionPress = () => {
    // Ticket P2-T2 only delivers toolbar shell; write flows attach in later tickets.
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
              groupingBulkAction={groupingBulkAction}
              onListInteraction={dismissSearch}
              isBulkSelectionModeActive={bulkSelectionState.isActive}
              selectedBulkItemIds={bulkSelectionState.selectedItemIds}
              onToggleBulkSelectionItem={handleToggleBulkSelectionItem}
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
          <View className="h-16 min-w-72 flex-row items-center justify-between rounded-full border border-border bg-accent/90 px-5 shadow-sm">
            {bulkToolbarActions.map(action => (
              <HapticPressable
                key={action.id}
                onPress={handleBulkToolbarActionPress}
                disabled={action.isDisabled}
                haptic={!action.isDisabled}
                hapticType="selection"
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityState={{ disabled: action.isDisabled }}
                className={cn(
                  'items-center gap-1 px-1.5',
                  action.isDisabled && 'opacity-40'
                )}
              >
                <Icon
                  as={bulkToolbarIcons[action.id]}
                  size={18}
                  strokeWidth={2.25}
                  className={
                    action.isDestructive ? 'text-destructive' : 'text-foreground'
                  }
                />
                <Text
                  className={cn(
                    'text-[10px] font-medium leading-none',
                    action.isDestructive
                      ? 'text-destructive'
                      : 'text-accent-foreground'
                  )}
                >
                  {action.label}
                </Text>
              </HapticPressable>
            ))}
          </View>
        </Animated.View>
      </>
    </>
  );
};
