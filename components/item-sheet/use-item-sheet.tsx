import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import {
  BaseGroceryItem,
  GroceryListItem,
} from '../../features/grocery-list/types';

const itemSheetContext = createContext<{
  onSelect: (item: BaseGroceryItem) => void;
  selectedItem: BaseGroceryItem | null;
  setSelectedItem: (item: BaseGroceryItem | null) => void;
  onSubmit: () => void;
  itemInputValue: string;
  itemInputRef: React.RefObject<TextInput | null>;
  onChangeItemText: (text: string) => void;
  notesInputValue: string;

  onChangeNotesText: (text: string) => void;
  showMatchingItems: boolean;
  setShowMatchingItems: (show: boolean) => void;
  category?: string;
  setCategory: (category?: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  unit: string;
  setUnit: (unit: string) => void;
  reset: () => void;
  itemId: string | null;
  setItemId: (id: string | null) => void;
  setFromItem: (item: GroceryListItem) => void;
} | null>(null);

export const useItemSheet = () => {
  const context = useContext(itemSheetContext);
  if (!context) {
    throw new Error('useAddItem must be used within an ItemSheetProvider');
  }
  return context;
};

type ItemSheetProviderProps = {
  children: React.ReactNode;
  groceryListId: string;
  onSubmit: ({
    item,
    listId,
    itemId,
  }: {
    item: BaseGroceryItem;
    listId: string;
    itemId: string | null;
  }) => void;
  setFromItemRef?: React.MutableRefObject<
    ((item: GroceryListItem) => void) | null
  >;
};

export const ItemSheetProvider = ({
  children,
  groceryListId,
  onSubmit,
  setFromItemRef,
}: ItemSheetProviderProps) => {
  const [selectedItem, setSelectedItem] = useState<BaseGroceryItem | null>(
    null
  );
  const [itemInputValue, setItemInputValue] = useState('');
  const [notesInputValue, setNotesInputValue] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('each');
  const itemInputRef = useRef<TextInput>(null);
  const [showMatchingItems, setShowMatchingItems] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  const reset = () => {
    setSelectedItem(null);
    setItemInputValue('');
    setNotesInputValue('');
    setCategory(undefined);
    setQuantity(1);
    setUnit('each');
    setShowMatchingItems(false);
    setItemId(null);
  };

  const setFromItem = (item: GroceryListItem) => {
    setItemId(item.id);
    setItemInputValue(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setNotesInputValue(item.notes ?? '');
    setShowMatchingItems(false);
  };

  // Expose setFromItem to parent via ref
  useEffect(() => {
    if (setFromItemRef) {
      setFromItemRef.current = setFromItem;
    }
  }, [setFromItemRef]);

  const submitItem = () => {
    onSubmit({
      listId: groceryListId,
      itemId,
      item: {
        name: itemInputValue,
        category: category,
        quantity: quantity,
        unit: unit,
        notes: notesInputValue,
      },
    });
    reset();
  };

  const onSelect = (item: BaseGroceryItem) => {
    setSelectedItem(item);
    setItemInputValue(item.name);
    setCategory(item.category);
    setShowMatchingItems(false);
  };

  const onChangeItemText = (text: string) => {
    setItemInputValue(text);
    setShowMatchingItems(true);
  };
  const onChangeNotesText = (text: string) => {
    setNotesInputValue(text);
  };

  return (
    <itemSheetContext.Provider
      value={{
        onSelect,
        selectedItem,
        setSelectedItem,
        onSubmit: submitItem,
        itemInputValue,
        itemInputRef,
        notesInputValue,
        onChangeNotesText,
        showMatchingItems,
        setShowMatchingItems,
        onChangeItemText,
        category,
        setCategory,
        quantity,
        setQuantity,
        unit,
        setUnit,
        reset,
        itemId,
        setItemId,
        setFromItem,
      }}
    >
      {children}
    </itemSheetContext.Provider>
  );
};
