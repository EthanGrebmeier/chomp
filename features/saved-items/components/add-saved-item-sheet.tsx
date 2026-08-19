import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import { StoreSheet } from '../../../components/item-sheet/store-sheet';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { BaseGroceryItem } from '../../grocery-list/types';
import { addSavedItem } from '../instant/add-saved-item';
import { UnifiedSavedItem } from '../types';

import {
  LiveSavedItemSyncHandle,
  useLiveSavedItemSync,
} from './edit-saved-item/use-live-saved-item-sync';

type SavedItemSheetContextType = {
  present: (item?: UnifiedSavedItem) => void;
};

const SavedItemSheetContext = createContext<SavedItemSheetContextType | null>(
  null
);

export const useSavedItemSheet = () => {
  const context = useContext(SavedItemSheetContext);
  if (!context) {
    throw new Error(
      'useSavedItemSheet must be used within a SavedItemSheetProvider'
    );
  }
  return context;
};

const SavedItemMetaBar = () => {
  const { category, setCategory, storeId, setStoreId } = useItemSheet();

  return (
    <MetaBarLayout>
      <View className="flex-row gap-2">
        <CategorySheet category={category} onSelect={setCategory} />
        <StoreSheet storeId={storeId} onSelect={setStoreId} />
      </View>
    </MetaBarLayout>
  );
};

const SavedItemSheetContents = ({ isEditing }: { isEditing: boolean }) => {
  const {
    reset,
    mode,
    itemInputRef,
    itemInputValue,
    itemInputKey,
    itemInputDefaultValue,
    showMatchingItems,
    setShowMatchingItems,
    onChangeItemText,
    onSelect,
    onSubmit,
    isValid,
    disableAutocomplete,
  } = useItemSheet();
  const { sheetRef, liveSyncRef } = useSavedItemSheetInternal();

  const handleSubmitEditing =
    mode === 'update' ? () => itemInputRef.current?.blur() : onSubmit;

  // Keep add-mode semantics unchanged (reset on close start), but in edit mode
  // flush pending debounced writes before state resets.
  const onStartClose = useCallback(() => {
    if (isEditing) {
      liveSyncRef.current?.flushAndSyncOnClose();
      return;
    }
    reset();
  }, [isEditing, liveSyncRef, reset]);

  const onDismiss = useCallback(() => {
    if (!isEditing) return;
    reset();
    liveSyncRef.current?.clearSnapshot();
  }, [isEditing, liveSyncRef, reset]);

  return (
    <BottomSheet
      viewClassName={isEditing ? undefined : 'pb-4'}
      name="saved-item-sheet"
      ref={sheetRef}
      onStartClose={onStartClose}
      onDismiss={isEditing ? onDismiss : undefined}
      onOpen={() => {
        if (!isEditing) {
          itemInputRef.current?.focus();
        }
      }}
      footer={
        isEditing ? (
          <BottomSheet.SheetView className="pb-safe px-4 pt-3">
            <SavedItemMetaBar />
          </BottomSheet.SheetView>
        ) : (
          <View className="px-10 pb-4">
            <Button onPress={onSubmit} disabled={!isValid}>
              <Text>Add</Text>
            </Button>
          </View>
        )
      }
    >
      <BottomSheet.SheetView
        className={isEditing ? 'pb-20' : 'pb-safe gap-4'}
      >
        <BottomSheet.Header
          title={isEditing ? 'Edit saved item' : 'Save item for later'}
        />
        <ItemInput
          placeholder="Item name"
          inputKey={itemInputKey}
          defaultValue={itemInputDefaultValue}
          matchingValue={itemInputValue}
          onChangeText={onChangeItemText}
          onSelect={onSelect}
          showMatchingItems={showMatchingItems}
          setShowMatchingItems={setShowMatchingItems}
          onSubmit={handleSubmitEditing}
          inputRef={itemInputRef}
          disableAutocomplete={disableAutocomplete}
        />
        {!isEditing ? <SavedItemMetaBar /> : null}
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

// Internal context for sharing the sheet ref
type SavedItemSheetInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
  liveSyncRef: React.RefObject<LiveSavedItemSyncHandle | null>;
};

const SavedItemSheetInternalContext =
  createContext<SavedItemSheetInternalContextType | null>(null);

const useSavedItemSheetInternal = () => {
  const context = useContext(SavedItemSheetInternalContext);
  if (!context) {
    throw new Error(
      'useSavedItemSheetInternal must be used within a SavedItemSheetProvider'
    );
  }
  return context;
};

type SavedItemSheetProviderProps = {
  children: React.ReactNode;
};

const SavedItemLiveSync = ({
  editingItem,
  onPromoteToCloud,
}: {
  editingItem: UnifiedSavedItem | null;
  onPromoteToCloud: (item: UnifiedSavedItem) => void;
}) => {
  const { liveSyncRef } = useSavedItemSheetInternal();

  useLiveSavedItemSync({
    editingItem,
    onPromoteToCloud,
    handleRef: liveSyncRef,
  });

  return null;
};

export const SavedItemSheetProvider = ({
  children,
}: SavedItemSheetProviderProps) => {
  const [editingItem, setEditingItem] = useState<UnifiedSavedItem | null>(null);
  const sheetRef = useRef<TrueSheet>(null);
  const liveSyncRef = useRef<LiveSavedItemSyncHandle | null>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);

  const isEditing = !!editingItem;

  const onSubmit = ({ item }: { item: BaseGroceryItem }) => {
    if (!isEditing) {
      addSavedItem({
        name: item.name,
        category: item.category,
        storeId: item.storeId,
      });
    }
  };

  const present = useCallback((item?: UnifiedSavedItem) => {
    if (item) {
      setEditingItem(item);
      setFromItemRef.current?.({
        name: item.name,
        quantity: 1,
        unit: 'each',
        category: item.category ?? undefined,
        storeId: item.storeId,
      });
      liveSyncRef.current?.captureSnapshot(item);
    } else {
      setEditingItem(null);
    }
    sheetRef.current?.present();
  }, []);
  const sheetContextValue = useMemo(() => ({ present }), [present]);

  return (
    <SavedItemSheetContext.Provider value={sheetContextValue}>
      <SavedItemSheetInternalContext.Provider value={{ sheetRef, liveSyncRef }}>
        <ItemSheetProvider
          mode={isEditing ? 'update' : 'add'}
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
          disableAutocomplete
        >
          <SavedItemLiveSync
            editingItem={editingItem}
            onPromoteToCloud={setEditingItem}
          />
          <SavedItemSheetContents isEditing={isEditing} />
          {children}
        </ItemSheetProvider>
      </SavedItemSheetInternalContext.Provider>
    </SavedItemSheetContext.Provider>
  );
};

// Keep the old export for backwards compatibility
export const AddSavedItemProvider = SavedItemSheetProvider;
