import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
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
import { updateSavedItem } from '../unified/update-saved-item';

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

const SavedItemMetaBar = ({ submitLabel }: { submitLabel: string }) => {
  const { category, setCategory, onSubmit, isValid } = useItemSheet();

  return (
    <MetaBarLayout
      action={
        <Button variant="default" onPress={onSubmit} disabled={!isValid}>
          <Text>{submitLabel}</Text>
        </Button>
      }
    >
      <View className="flex-row">
        <CategorySheet category={category} onSelect={setCategory} />
      </View>
    </MetaBarLayout>
  );
};

const SavedItemSheetContents = ({ submitLabel }: { submitLabel: string }) => {
  const { reset, itemInputRef } = useItemSheet();
  const { sheetRef } = useSavedItemSheetInternal();

  return (
    <BottomSheet
      viewClassName="pb-4"
      name="saved-item-sheet"
      ref={sheetRef}
      onStartClose={reset}
      onOpen={() => {
        itemInputRef.current?.focus();
      }}
    >
      <BottomSheet.SheetView className="gap-4">
        <ItemInput placeholder="Item name" />
        <SavedItemMetaBar submitLabel={submitLabel} />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

// Internal context for sharing the sheet ref
type SavedItemSheetInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
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

export const SavedItemSheetProvider = ({
  children,
}: SavedItemSheetProviderProps) => {
  const [editingItem, setEditingItem] = useState<UnifiedSavedItem | null>(null);
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);

  const isEditing = !!editingItem;

  const onSubmit = ({ item }: { item: BaseGroceryItem }) => {
    if (isEditing && editingItem) {
      updateSavedItem({
        item: editingItem,
        updates: {
          name: item.name,
          category: item.category,
        },
      });
      toast.success(`${item.name} updated`);
    } else {
      addSavedItem({
        name: item.name,
        category: item.category,
      });
      toast.success(`${item.name} added to saved items`);
    }
  };

  const present = (item?: UnifiedSavedItem) => {
    if (item) {
      setEditingItem(item);
      setFromItemRef.current?.({
        name: item.name,
        quantity: 1,
        unit: 'each',
        category: item.category ?? undefined,
      });
    } else {
      setEditingItem(null);
    }
    sheetRef.current?.present();
  };

  return (
    <SavedItemSheetContext.Provider value={{ present }}>
      <SavedItemSheetInternalContext.Provider value={{ sheetRef }}>
        <ItemSheetProvider
          mode="add"
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
          disableAutocomplete
        >
          <SavedItemSheetContents submitLabel={isEditing ? 'Update' : 'Add'} />
          {children}
        </ItemSheetProvider>
      </SavedItemSheetInternalContext.Provider>
    </SavedItemSheetContext.Provider>
  );
};

// Keep the old export for backwards compatibility
export const AddSavedItemProvider = SavedItemSheetProvider;
