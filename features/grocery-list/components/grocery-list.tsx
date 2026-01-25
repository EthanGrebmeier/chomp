import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRef, useState } from 'react';
import { Keyboard, TextInput as RNTextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import AddItemSheet from '../../../components/item-sheet/add-item/add-item-sheet';
import EditItemProvider from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { db } from '../../../lib/instant';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
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
import { GroupBySelector } from './group-by-selector';
import { SearchBar } from './search-bar';
import { ShareListSheet, ShareListSheetRef } from './share-list-sheet';
import { SortBySelector } from './sort-by-selector';

type GroceryListProps = {
  listId?: string;
  listName?: string;
  joinCode?: string;
  ownerId?: string;
  isShared?: boolean;
  items: GroceryListItemWithRecipe[];
  groupBy: 'category' | 'none' | 'recipe' | 'store';
  sortBy: 'name' | 'recent';
  onTitlePress?: () => void;
  onDeleteOrLeave: () => void;
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
  onTitlePress,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCount, setFilteredCount] = useState(items.length);

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

  return (
    <>
      <View
        className="flex-1 gap-2"
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
          onTitlePress={onTitlePress}
        />
        <EditItemProvider groceryListId={listId ?? ''}>
          <View className="flex-1">
            <SearchBar
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              totalItems={items.filter(item => !item.isChecked).length}
              matchingCount={filteredCount}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row gap-2 px-4 pb-2 pt-3"
              className="flex-grow-0"
              onScrollBeginDrag={dismissSearch}
              onTouchStart={dismissSearch}
            >
              <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
              <SortBySelector value={sortBy} onChange={handleSortByChange} />
            </ScrollView>

            <GroceryItemsList
              items={items}
              groupBy={groupBy}
              sortBy={sortBy}
              searchQuery={searchQuery}
              onFilteredCountChange={setFilteredCount}
              onListInteraction={dismissSearch}
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
      {listId && <AddItemSheet groceryListId={listId} />}
    </>
  );
};
