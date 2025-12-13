import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { updateGroceryListItem } from '../../../features/grocery-list/instant/update-grocery-list-item';
import {
  BaseGroceryItem,
  GroceryListItem,
} from '../../../features/grocery-list/types';
import { BottomSheet } from '../../bottom-sheet';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import EditItemBottomBar from './edit-item-bottom-bar';

type EditItemContextType = {
  present: (item: GroceryListItem) => void;
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
  const { sheetRef } = useEditItemSheetInternal();

  return (
    <BottomSheet
      viewClassName="pb-4"
      ignoreSafeArea
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={reset}
    >
      <View>
        <ItemForm />
        <MetaBar />
        <EditItemBottomBar />
      </View>
    </BottomSheet>
  );
};

// Internal context for sharing the sheet ref
type EditItemInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
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
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: GroceryListItem) => void) | null>(null);

  const onSubmit = ({
    item,
    itemId,
  }: {
    item: BaseGroceryItem;
    listId: string;
    itemId: string | null;
  }) => {
    if (!itemId) return;

    updateGroceryListItem({
      itemId,
      item: {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
      },
    });
    toast.success(`${item.name} updated`);
    sheetRef.current?.dismiss();
  };

  const present = (item: GroceryListItem) => {
    setFromItemRef.current?.(item);
    sheetRef.current?.present();
  };

  return (
    <EditItemContext.Provider value={{ present }}>
      <EditItemInternalContext.Provider value={{ sheetRef }}>
        <ItemSheetProvider
          groceryListId={groceryListId}
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
        >
          <EditItemContents />
          {children}
        </ItemSheetProvider>
      </EditItemInternalContext.Provider>
    </EditItemContext.Provider>
  );
};

export default EditItemProvider;
