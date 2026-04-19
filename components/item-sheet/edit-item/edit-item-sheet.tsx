import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { unlinkRecipeFromItem } from '../../../features/grocery-list/instant/unlink-recipe-from-item';
import { updateGroceryListItem } from '../../../features/grocery-list/instant/update-grocery-list-item';
import {
  BaseGroceryItem,
  GroceryListItemWithRecipe,
} from '../../../features/grocery-list/types';
import { BottomSheet } from '../../bottom-sheet';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import { UseLiveItemSyncHandle, useLiveItemSync } from './use-live-item-sync';

type EditItemContextType = {
  present: (item: GroceryListItemWithRecipe) => void;
  dismiss: () => void;
};

const EditItemContext = createContext<EditItemContextType | null>(null);

export const useEditItemSheet = () => {
  const context = useContext(EditItemContext);
  if (!context) {
    throw new Error('useEditItemSheet must be used within an EditItemProvider');
  }
  return context;
};

const EditItemContents = () => {
  const { reset, isValid, onSubmit } = useItemSheet();
  const { sheetRef, liveSyncRef } = useEditItemSheetInternal();

  const onStartClose = useCallback(() => {
    reset();
    liveSyncRef.current?.clearSnapshot();
  }, [reset, liveSyncRef]);

  return (
    <BottomSheet
      footer={
        <View className="px-10 pb-4">
          <Button
            variant="default"
            size="default"
            onPress={onSubmit}
            disabled={!isValid}
          >
            <Text className="text-primary-foreground">Update Item</Text>
          </Button>
        </View>
      }
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={onStartClose}
    >
      <BottomSheet.SheetView className="pb-safe">
        <ItemForm />
        <MetaBar />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

type EditItemLiveSyncProps = {
  selectedItemId: string | null;
  currentStoreId: string | undefined;
  currentSavedItemId: string | undefined;
  currentSavedItemOwnerId: string | undefined;
  currentSavedItemStoreId: string | undefined;
  currentItemName: string | undefined;
};

// Thin component whose only job is to live inside the ItemSheetProvider
// subtree so useLiveItemSync can read the shared form state. It publishes
// its imperative handle through liveSyncRef on the internal context.
const EditItemLiveSync = (props: EditItemLiveSyncProps) => {
  const { liveSyncRef } = useEditItemSheetInternal();
  useLiveItemSync({ ...props, handleRef: liveSyncRef });
  return null;
};

// Internal context for sharing the sheet ref and live-sync handle with
// descendants that sit inside ItemSheetProvider.
type EditItemInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
  liveSyncRef: React.RefObject<UseLiveItemSyncHandle | null>;
};

const EditItemInternalContext =
  createContext<EditItemInternalContextType | null>(null);

const useEditItemSheetInternal = () => {
  const context = useContext(EditItemInternalContext);
  if (!context) {
    throw new Error(
      'useEditItemSheetInternal must be used within an EditItemProvider'
    );
  }
  return context;
};

type EditItemProps = {
  groceryListId: string;
  children: React.ReactNode;
};

const EditItemProvider = ({ groceryListId, children }: EditItemProps) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [currentItemName, setCurrentItemName] = useState<string | undefined>(
    undefined
  );
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(
    undefined
  );
  const [currentSavedItemId, setCurrentSavedItemId] = useState<
    string | undefined
  >(undefined);
  const [currentSavedItemOwnerId, setCurrentSavedItemOwnerId] = useState<
    string | undefined
  >(undefined);
  const [currentSavedItemStoreId, setCurrentSavedItemStoreId] = useState<
    string | undefined
  >(undefined);
  const sheetRef = useRef<TrueSheet>(null);
  const liveSyncRef = useRef<UseLiveItemSyncHandle | null>(null);
  const setFromItemRef = useRef<
    ((item: GroceryListItemWithRecipe | BaseGroceryItem) => void) | null
  >(null);

  const onSubmit = ({
    item,
    clearedRecipeId,
    selectedCloudSavedItemId,
    selectedCloudSavedItemStoreId,
    selectedLocalSavedItemId,
  }: {
    item: BaseGroceryItem;
    listId?: string;
    clearedRecipeId?: string;
    selectedCloudSavedItemId?: string;
    selectedCloudSavedItemStoreId?: string;
    selectedLocalSavedItemId?: string;
  }) => {
    if (!selectedItemId) return;

    updateGroceryListItem({
      itemId: selectedItemId,
      item: {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
        storeId: item.storeId,
      },
      currentStoreId,
      currentSavedItemId,
      currentSavedItemOwnerId,
      currentSavedItemStoreId,
      selectedSavedItemId: selectedCloudSavedItemId,
      selectedSavedItemStoreId: selectedCloudSavedItemStoreId,
      selectedLocalSavedItemId,
      currentItemName,
    });

    // Unlink recipe if it was cleared
    if (clearedRecipeId) {
      unlinkRecipeFromItem({
        itemId: selectedItemId,
        recipeId: clearedRecipeId,
      });
    }

    toast.success(`${item.name} updated`);
    sheetRef.current?.dismiss();
  };

  const present = (item: GroceryListItemWithRecipe) => {
    setFromItemRef.current?.(item);
    setSelectedItemId(item.id);
    setCurrentItemName(item.name);
    setCurrentStoreId(item.store?.id);
    setCurrentSavedItemId(item.saved_item?.id);
    setCurrentSavedItemOwnerId(item.saved_item?.user?.id);
    setCurrentSavedItemStoreId(item.saved_item?.store?.id);
    // Capture a diff baseline before presenting so the first render inside
    // the sheet doesn't fire a spurious live write when setFromItem pushes
    // the item's values into the shared form state.
    liveSyncRef.current?.captureSnapshot(item);
    sheetRef.current?.present();
  };

  const dismiss = () => {
    sheetRef.current?.dismiss();
  };

  return (
    <EditItemContext.Provider value={{ present, dismiss }}>
      <EditItemInternalContext.Provider value={{ sheetRef, liveSyncRef }}>
        <ItemSheetProvider
          mode="update"
          listId={groceryListId}
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
        >
          <EditItemLiveSync
            selectedItemId={selectedItemId}
            currentStoreId={currentStoreId}
            currentSavedItemId={currentSavedItemId}
            currentSavedItemOwnerId={currentSavedItemOwnerId}
            currentSavedItemStoreId={currentSavedItemStoreId}
            currentItemName={currentItemName}
          />
          <EditItemContents />
          {children}
        </ItemSheetProvider>
      </EditItemInternalContext.Provider>
    </EditItemContext.Provider>
  );
};

export default EditItemProvider;
