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
  inputValue: string;
  onChangeText: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;
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
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('each');
  const inputRef = useRef<TextInput>(null);
  const [showMatchingItems, setShowMatchingItems] = useState(false);

  const reset = () => {
    setSelectedItem(null);
    setInputValue('');
    setCategory(undefined);
    setQuantity(1);
    setUnit('each');
  };

  const addItem = () => {
    addGroceryListItem({
      listId: groceryListId,
      item: {
        name: inputValue,
        category: category,
        quantity: quantity,
        unit: unit,
        isChecked: false,
      },
    });
    reset();

    toast.success(`${inputValue} added`);
  };

  const onSelect = (item: BaseGroceryItem) => {
    setSelectedItem(item);
    setInputValue(item.name);
    setCategory(item.category);
    setShowMatchingItems(false);
  };

  const onChangeText = (text: string) => {
    setInputValue(text);
    setShowMatchingItems(true);
  };

  return (
    <addItemContext.Provider
      value={{
        onSelect,
        selectedItem,
        setSelectedItem,
        addItem,
        inputValue,
        inputRef,
        showMatchingItems,
        setShowMatchingItems,
        onChangeText,
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
