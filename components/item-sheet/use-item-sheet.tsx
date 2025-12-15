import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import {
  BaseGroceryItem,
  GroceryListItemWithRecipe,
} from '../../features/grocery-list/types';
import { Recipe } from '../../features/recipes/types';

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
  recipe?: Recipe | null;
  setRecipe: (recipe?: Recipe | null) => void;
  reset: () => void;
  setFromItem: (item: GroceryListItemWithRecipe) => void;
  isValid: boolean;
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
  listId?: string;
  onSubmit: (args: {
    item: BaseGroceryItem;
    listId?: string;
    clearedRecipeId?: string;
  }) => void;
  setFromItemRef?: React.RefObject<
    ((item: GroceryListItemWithRecipe) => void) | null
  >;
};

export const ItemSheetProvider = ({
  children,
  listId,
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
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [initialRecipeId, setInitialRecipeId] = useState<string | undefined>(
    undefined
  );
  const itemInputRef = useRef<TextInput>(null);
  const [showMatchingItems, setShowMatchingItems] = useState(false);

  const reset = () => {
    setSelectedItem(null);
    setItemInputValue('');
    setNotesInputValue('');
    setCategory(undefined);
    setQuantity(1);
    setUnit('each');
    setRecipe(undefined);
    setInitialRecipeId(undefined);
    setShowMatchingItems(false);
  };

  const setFromItem = (item: GroceryListItemWithRecipe) => {
    setItemInputValue(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setNotesInputValue(item.notes ?? '');
    setRecipe(item.recipe);
    setInitialRecipeId(item.recipe?.id);
    setShowMatchingItems(false);
  };

  // Expose setFromItem to parent via ref
  useEffect(() => {
    if (setFromItemRef) {
      setFromItemRef.current = (item: GroceryListItemWithRecipe) =>
        setFromItem(item);
    }
  }, [setFromItemRef]);

  // Check if recipe was cleared (had initial recipe, now undefined/null)
  const recipeCleared = !!initialRecipeId && !recipe;

  const submitItem = () => {
    onSubmit({
      listId,
      item: {
        name: itemInputValue,
        category: category,
        quantity: quantity,
        unit: unit,
        notes: notesInputValue,
      },
      clearedRecipeId: recipeCleared ? initialRecipeId : undefined,
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
        recipe,
        setRecipe,
        reset,
        setFromItem,
        isValid: !!itemInputValue.length && !!quantity && !!unit,
      }}
    >
      {children}
    </itemSheetContext.Provider>
  );
};
