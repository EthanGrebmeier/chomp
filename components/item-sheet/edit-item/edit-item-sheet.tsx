import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef, useState } from 'react';
import { toast } from 'sonner-native';

import { unlinkRecipeFromItem } from '../../../features/grocery-list/instant/unlink-recipe-from-item';
import { updateGroceryListItem } from '../../../features/grocery-list/instant/update-grocery-list-item';
import {
  BaseGroceryItem,
  GroceryListItemWithRecipe,
} from '../../../features/grocery-list/types';
import { BottomSheet } from '../../bottom-sheet';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

type EditItemContextType = {
  present: (item: GroceryListItemWithRecipe) => void;
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
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={reset}
    >
      <BottomSheet.SheetView>
        <ItemForm />
        <MetaBar submitLabel="Update" />
      </BottomSheet.SheetView>
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<
    ((item: GroceryListItemWithRecipe) => void) | null
  >(null);

  const onSubmit = ({
    item,
    clearedRecipeId,
  }: {
    item: BaseGroceryItem;
    listId?: string;
    clearedRecipeId?: string;
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
      },
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
    sheetRef.current?.present();
  };

  return (
    <EditItemContext.Provider value={{ present }}>
      <EditItemInternalContext.Provider value={{ sheetRef }}>
        <ItemSheetProvider
          listId={groceryListId}
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
