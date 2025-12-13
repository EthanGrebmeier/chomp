import { createContext, useContext, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { toast } from 'sonner-native';

import { addGroceryListItem } from '../../instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../types';

const addItemContext = createContext<{
  onSelect: (item: BaseGroceryItem) => void;
  selectedItem: BaseGroceryItem | null;
  setSelectedItem: (item: BaseGroceryItem | null) => void;
  addItem: () => void;
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
} | null>(null);

export const useAddItem = () => {
  const context = useContext(addItemContext);
  if (!context) {
    throw new Error('useAddItem must be used within an AddItemProvider');
  }
  return context;
};

export const AddItemProvider = ({
  children,
  groceryListId,
}: {
  children: React.ReactNode;
  groceryListId: string;
}) => {
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

  const reset = () => {
    setSelectedItem(null);
    setItemInputValue('');
    setNotesInputValue('');
    setCategory(undefined);
    setQuantity(1);
    setUnit('each');
    setShowMatchingItems(false);
  };

  const addItem = () => {
    addGroceryListItem({
      listId: groceryListId,
      item: {
        name: itemInputValue,
        category: category,
        quantity: quantity,
        unit: unit,
        isChecked: false,
        notes: notesInputValue,
      },
    });
    reset();

    toast.success(`${itemInputValue} added`);
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
    <addItemContext.Provider
      value={{
        onSelect,
        selectedItem,
        setSelectedItem,
        addItem,
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
      }}
    >
      {children}
    </addItemContext.Provider>
  );
};
