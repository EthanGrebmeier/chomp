import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { ItemEditorSheet } from '../../../components/item-sheet/item-editor-sheet';
import { StoreSheet } from '../../../components/item-sheet/store-sheet';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
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
  const { category, setCategory, storeId, setStoreId, hasItemTitle } =
    useItemSheet();

  return (
    <MetaBarLayout>
      <ScrollingMetaBar>
        <CategorySheet
          category={category}
          onSelect={setCategory}
          disabled={!hasItemTitle}
        />
        <StoreSheet
          storeId={storeId}
          onSelect={setStoreId}
          disabled={!hasItemTitle}
        />
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};

const SavedItemSheetContents = ({ isEditing }: { isEditing: boolean }) => {
  const { reset } = useItemSheet();
  const { sheetRef, liveSyncRef } = useSavedItemSheetInternal();

  const onStartClose = useCallback(() => {
    if (isEditing) liveSyncRef.current?.flushAndSyncOnClose();
  }, [isEditing, liveSyncRef]);

  const onDismiss = useCallback(() => {
    reset();
    liveSyncRef.current?.clearSnapshot();
  }, [liveSyncRef, reset]);

  return (
    <ItemEditorSheet
      name="saved-item-sheet"
      title={isEditing ? 'Edit saved item' : 'Save item for later'}
      sheetRef={sheetRef}
      onStartClose={onStartClose}
      onDismiss={onDismiss}
      showNotes={false}
      metadata={<SavedItemMetaBar />}
      actionLabel={isEditing ? undefined : 'Add saved item'}
    />
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
