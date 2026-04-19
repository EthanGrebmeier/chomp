import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

import { unlinkRecipeFromItem } from '../../../features/grocery-list/instant/unlink-recipe-from-item';
import {
  BaseGroceryItem,
  GroceryListItemWithRecipe,
} from '../../../features/grocery-list/types';
import { BottomSheet } from '../../bottom-sheet';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';
import { MatchingItem } from '../use-matching-items';

import { UseLiveItemSyncHandle, useLiveItemSync } from './use-live-item-sync';

type EditItemContextType = {
  present: (item: GroceryListItemWithRecipe) => void;
  dismiss: () => void;
  /**
   * Immediately unlink the recipe association from the currently-presented
   * grocery item. RecipeTag calls this from its X-button so the detach
   * lands as soon as the user taps it, rather than waiting for sheet close
   * like the pre-live-updates submit path did.
   */
  clearRecipe: (recipeId: string) => void;
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
  const { reset } = useItemSheet();
  const { sheetRef, liveSyncRef } = useEditItemSheetInternal();

  // Fires while the sheet is starting to close (swipe, tap-outside,
  // programmatic dismiss). Still-current form state is readable here, so
  // flushing the pending debounce and running the close-time saved-item
  // sync must happen now — before onDismiss wipes the state.
  const onStartClose = useCallback(() => {
    liveSyncRef.current?.flushAndSyncOnClose();
  }, [liveSyncRef]);

  // Fires after the sheet has fully dismissed. Safe to drop form state and
  // the diff baseline here because no further edits can arrive.
  const onDismiss = useCallback(() => {
    reset();
    liveSyncRef.current?.clearSnapshot();
  }, [reset, liveSyncRef]);

  return (
    <BottomSheet
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={onStartClose}
      onDismiss={onDismiss}
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

  // The Update Item button and its submit path were removed when the Edit
  // sheet moved to live updates (PRD "Edit Item Sheet — Live Updates",
  // P3-T2). All grocery-item writes now flow through useLiveItemSync;
  // saved-item sync happens in flushAndSyncOnClose via onStartClose. This
  // no-op satisfies ItemSheetProvider's onSubmit contract (shared with the
  // Add flow) without duplicating writes. Return-key in the name input
  // still routes here until P3-T3 swaps it for a blur.
  const onSubmit = () => {};

  // Autocomplete pick in the Edit flow: after ItemSheetProvider.onSelect
  // populates the shared form state, route the pick into useLiveItemSync
  // so it can cancel the pending text-field debounce, fire the immediate
  // grocery-item write (with relink), and rebase the diff snapshot.
  const onPickMatch = useCallback((match: MatchingItem) => {
    liveSyncRef.current?.onPickCloudMatch(match, match.ownerId);
  }, []);

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

  // Fire the unlink the moment the user clears the recipe tag rather than
  // deferring it to sheet close. The old submit path used to collect a
  // `clearedRecipeId` and flush it alongside the grocery-item write; that
  // path is gone (P3-T2), so we commit directly here. No-op when no item
  // is currently presented (defensive — RecipeTag only renders when there
  // is one).
  const clearRecipe = useCallback(
    (recipeId: string) => {
      if (!selectedItemId) return;
      unlinkRecipeFromItem({ itemId: selectedItemId, recipeId });
    },
    [selectedItemId]
  );

  return (
    <EditItemContext.Provider value={{ present, dismiss, clearRecipe }}>
      <EditItemInternalContext.Provider value={{ sheetRef, liveSyncRef }}>
        <ItemSheetProvider
          mode="update"
          listId={groceryListId}
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
          onPickMatch={onPickMatch}
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
