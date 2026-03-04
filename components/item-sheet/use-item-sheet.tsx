import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import {
  BaseGroceryItem,
  GroceryListItemWithRecipe,
} from '../../features/grocery-list/types';
import { Recipe } from '../../features/recipes/types';

import { MatchingItem } from './use-matching-items';

const itemSheetContext = createContext<{
  onSelect: (item: MatchingItem) => void;
  selectedItem: MatchingItem | null;
  setSelectedItem: (item: MatchingItem | null) => void;
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
  storeId?: string;
  setStoreId: (storeId?: string) => void;
  reset: () => void;
  setFromItem: (item: GroceryListItemWithRecipe | BaseGroceryItem) => void;
  isValid: boolean;
  disableAutocomplete: boolean;
  mode: ItemSheetMode;
} | null>(null);

export const useItemSheet = () => {
  const context = useContext(itemSheetContext);
  if (!context) {
    throw new Error('useAddItem must be used within an ItemSheetProvider');
  }
  return context;
};

type ItemSheetMode = 'add' | 'update';

type ItemSheetProviderProps = {
  mode: ItemSheetMode;
  children: React.ReactNode;
  listId?: string;
  onSubmit: (args: {
    item: BaseGroceryItem;
    listId?: string;
    clearedRecipeId?: string;
    selectedCloudSavedItemId?: string;
    selectedCloudSavedItemStoreId?: string;
    selectedLocalSavedItemId?: string;
  }) => void;
  setFromItemRef?: React.RefObject<
    ((item: GroceryListItemWithRecipe | BaseGroceryItem) => void) | null
  >;
  disableAutocomplete?: boolean;
};

export const ItemSheetProvider = ({
  children,
  listId,
  onSubmit,
  setFromItemRef,
  disableAutocomplete = false,
  mode,
}: ItemSheetProviderProps) => {
  const [selectedItem, setSelectedItem] = useState<MatchingItem | null>(
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
  const [storeId, setStoreId] = useState<string | undefined>(undefined);
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
    setStoreId(undefined);
    setShowMatchingItems(false);
  };

  const setFromItem = (item: GroceryListItemWithRecipe | BaseGroceryItem) => {
    setSelectedItem(null);
    setItemInputValue(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setNotesInputValue(item.notes ?? '');
    // Handle recipe - only available on GroceryListItemWithRecipe
    if ('recipe' in item) {
      setRecipe(item.recipe);
      setInitialRecipeId(item.recipe?.id);
    }
    // Handle store - check both store object and storeId
    if ('store' in item && item.store) {
      setStoreId(item.store.id);
    } else if ('storeId' in item) {
      setStoreId(item.storeId);
    }
    setShowMatchingItems(false);
  };

  // Expose setFromItem to parent via ref
  useEffect(() => {
    if (setFromItemRef) {
      setFromItemRef.current = (
        item: GroceryListItemWithRecipe | BaseGroceryItem
      ) => setFromItem(item);
    }
  }, [setFromItemRef]);

  // Check if recipe was cleared (had initial recipe, now undefined/null)
  const recipeCleared = !!initialRecipeId && !recipe;

  const submitItem = () => {
    const selectedCloudSavedItemId =
      selectedItem?.source === 'cloud'
        ? selectedItem.cloudSavedItemId
        : undefined;
    const selectedCloudSavedItemStoreId =
      selectedItem?.source === 'cloud' ? selectedItem.storeId : undefined;
    const selectedLocalSavedItemId =
      selectedItem?.source === 'local'
        ? selectedItem.localSavedItemId
        : undefined;

    onSubmit({
      listId,
      item: {
        name: itemInputValue,
        category: category,
        quantity: quantity,
        unit: unit,
        notes: notesInputValue,
        storeId: storeId,
      },
      clearedRecipeId: recipeCleared ? initialRecipeId : undefined,
      selectedCloudSavedItemId,
      selectedCloudSavedItemStoreId,
      selectedLocalSavedItemId,
    });
    reset();
  };

  const onSelect = (item: MatchingItem) => {
    setSelectedItem(item);
    setItemInputValue(item.name);
    setCategory(item.category);
    setNotesInputValue(item.notes ?? '');
    setStoreId(item.storeId);
    setShowMatchingItems(false);
  };

  const onChangeItemText = (text: string) => {
    setSelectedItem(null);
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
        storeId,
        setStoreId,
        reset,
        setFromItem,
        isValid: Boolean(
          !!itemInputValue.trim().length && !!quantity && !!unit
        ),
        disableAutocomplete,
        mode,
      }}
    >
      {children}
    </itemSheetContext.Provider>
  );
};
