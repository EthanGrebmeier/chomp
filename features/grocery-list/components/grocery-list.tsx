import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import AddItemSheet from '../../../components/item-sheet/add-item/add-item-sheet';
import EditItemProvider from '../../../components/item-sheet/edit-item/edit-item-sheet';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { addGroceryListItem } from '../instant/add-grocery-list-item';
import { clearGroceryList } from '../instant/clear-list';
import { incrementGroceryListItem } from '../instant/increment-grocery-list-item';
import { useGroceryListItems } from '../instant/use-grocery-list-items';
import { BaseGroceryItem } from '../types';

import { AddItemConflictSheet } from './add-item-conflict-sheet';
import { AddRecipeSheet, AddRecipeSheetRef } from './add-recipe-sheet';
import { ClearListConfirmationSheet } from './clear-list-confirmation-sheet';
import { GroceryItemsList } from './grocery-items-list';
import { GroceryListHeader } from './grocery-list-header';
import { GroupBySelector } from './group-by-selector';
import { ShareListSheet, ShareListSheetRef } from './share-list-sheet';
import { SortBySelector } from './sort-by-selector';

type GroceryListProps = {
  listId?: string;
  listName?: string;
  joinCode?: string;
  groupBy: 'category' | 'none' | 'recipe';
  sortBy: 'name' | 'recent';
  onTitlePress?: () => void;
};

export const GroceryList = ({
  listId,
  listName,
  joinCode,
  groupBy: initialGroupBy,
  sortBy: initialSortBy,
  onTitlePress,
}: GroceryListProps) => {
  const recipeSheetRef = useRef<AddRecipeSheetRef>(null);
  const shareListSheetRef = useRef<ShareListSheetRef>(null);
  const { mutate: updateSettings } = useUpdateSettings();

  const { data } = useGroceryListItems(listId);
  const items = data?.grocery_items ?? [];

  const [conflictItem, setConflictItem] = useState<{
    existingItemId: string;
    newItem: BaseGroceryItem;
  } | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'none' | 'recipe'>(
    initialGroupBy
  );
  const [sortBy, setSortBy] = useState<'name' | 'recent'>(initialSortBy);

  const addItemConflictSheetRef = useRef<TrueSheet | null>(null);
  const clearListConfirmationSheetRef = useRef<TrueSheet | null>(null);

  const handleGroupByChange = (newGroupBy: 'category' | 'none' | 'recipe') => {
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
    clearGroceryList({ listId });
  };

  const handleCancelClearList = () => {
    clearListConfirmationSheetRef.current?.dismiss();
  };

  const handleSharePress = () => {
    if (joinCode) {
      shareListSheetRef.current?.present(joinCode);
    }
  };

  return (
    <>
      <View className="flex-1 gap-2">
        {/** Header */}
        <GroceryListHeader
          listId={listId}
          itemCount={items.length}
          listName={listName}
          openRecipeSheet={() => recipeSheetRef.current?.present()}
          onClearListPress={handleClearListPress}
          onSharePress={handleSharePress}
          onTitlePress={onTitlePress}
        />
        <EditItemProvider groceryListId={listId ?? ''}>
          <View className="flex-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row gap-2 px-4 pb-2"
              className="flex-grow-0"
            >
              <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
              <SortBySelector value={sortBy} onChange={handleSortByChange} />
            </ScrollView>

            <GroceryItemsList items={items} groupBy={groupBy} sortBy={sortBy} />
          </View>
        </EditItemProvider>
        <AddRecipeSheet ref={recipeSheetRef} />
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
        <ShareListSheet ref={shareListSheetRef} />
      </View>
      {listId && <AddItemSheet groceryListId={listId} />}
    </>
  );
};
