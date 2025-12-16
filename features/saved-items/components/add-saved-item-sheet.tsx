import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { BaseGroceryItem } from '../../grocery-list/types';
import { addSavedItem } from '../instant/add-saved-item';

type AddSavedItemContextType = {
  present: () => void;
};

const AddSavedItemContext = createContext<AddSavedItemContextType | null>(null);

export const useAddSavedItemSheet = () => {
  const context = useContext(AddSavedItemContext);
  if (!context) {
    throw new Error(
      'useAddSavedItemSheet must be used within an AddSavedItemProvider'
    );
  }
  return context;
};

const SavedItemMetaBar = () => {
  const { category, setCategory, onSubmit, isValid } = useItemSheet();

  return (
    <View className="mt-3 flex-row items-center justify-between gap-2">
      <CategorySheet category={category} onSelect={setCategory} />
      <Button variant="default" onPress={onSubmit} disabled={!isValid}>
        <Text>Add</Text>
      </Button>
    </View>
  );
};

const AddSavedItemContents = () => {
  const { reset, itemInputRef } = useItemSheet();
  const { sheetRef } = useAddSavedItemSheetInternal();

  return (
    <BottomSheet
      viewClassName="pb-4"
      name="add-saved-item-sheet"
      ref={sheetRef}
      onStartClose={reset}
      onOpen={() => {
        itemInputRef.current?.focus();
      }}
    >
      <BottomSheet.SheetView>
        <ItemInput placeholder="Item name" />
        <SavedItemMetaBar />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

// Internal context for sharing the sheet ref
type AddSavedItemInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
};

const AddSavedItemInternalContext =
  createContext<AddSavedItemInternalContextType | null>(null);

const useAddSavedItemSheetInternal = () => {
  const context = useContext(AddSavedItemInternalContext);
  if (!context) {
    throw new Error(
      'useAddSavedItemSheetInternal must be used within an AddSavedItemProvider'
    );
  }
  return context;
};

type AddSavedItemProviderProps = {
  children: React.ReactNode;
};

export const AddSavedItemProvider = ({
  children,
}: AddSavedItemProviderProps) => {
  const sheetRef = useRef<TrueSheet>(null);

  const onSubmit = ({ item }: { item: BaseGroceryItem }) => {
    addSavedItem({
      name: item.name,
      category: item.category,
    });
    toast.success(`${item.name} added to saved items`);
  };

  const present = () => {
    sheetRef.current?.present();
  };

  return (
    <AddSavedItemContext.Provider value={{ present }}>
      <AddSavedItemInternalContext.Provider value={{ sheetRef }}>
        <ItemSheetProvider onSubmit={onSubmit} disableAutocomplete>
          <AddSavedItemContents />
          {children}
        </ItemSheetProvider>
      </AddSavedItemInternalContext.Provider>
    </AddSavedItemContext.Provider>
  );
};
