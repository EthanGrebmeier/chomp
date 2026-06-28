import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { TextInput } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';

import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';

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
  hasItemTitle: boolean;
  itemInputKey: number;
  itemInputDefaultValue: string;
  itemInputValueRef: React.MutableRefObject<string>;
  itemInputRef: React.RefObject<TextInput | null>;
  onChangeItemText: (text: string) => void;
  notesInputValue: string;
  notesInputKey: number;
  notesInputDefaultValue: string;
  notesInputValueRef: React.MutableRefObject<string>;
  notesInputRef: React.RefObject<TextInput | null>;
  getItemInputValue: () => string;
  getNotesInputValue: () => string;
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
  listId?: string;
  storeId?: string;
  setStoreId: (storeId?: string) => void;
  storeName?: string;
  setStoreName: (storeName?: string) => void;
  reset: () => void;
  setFromItem: (item: GroceryListItemWithRecipe | BaseGroceryItem) => void;
  isValid: boolean;
  disableAutocomplete: boolean;
  mode: ItemSheetMode;
} | null>(null);

const TEXT_COMMIT_DEBOUNCE_MS = 150;

export const useItemSheet = () => {
  const context = useContext(itemSheetContext);
  if (!context) {
    throw new Error('useAddItem must be used within an ItemSheetProvider');
  }
  return context;
};

type ItemSheetMode = 'add' | 'update';
type DefaultStoreSelection = {
  id: string;
  name: string;
};

type ItemSheetProviderProps = {
  mode: ItemSheetMode;
  children: React.ReactNode;
  listId?: string;
  defaultStore?: DefaultStoreSelection | null;
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
  /**
   * Optional observer fired after the shared form state has been populated
   * from an autocomplete pick. The Edit flow wires this to
   * useLiveItemSync.onPickCloudMatch so picks cancel the text-field
   * debounce, commit immediately, and rebase the diff snapshot. The Add
   * flow leaves this unset so its submit-on-button path is unchanged.
   */
  onPickMatch?: (match: MatchingItem) => void;
};

export const ItemSheetProvider = ({
  children,
  listId,
  defaultStore,
  onSubmit,
  setFromItemRef,
  disableAutocomplete = false,
  mode,
  onPickMatch,
}: ItemSheetProviderProps) => {
  const [selectedItem, setSelectedItem] = useState<MatchingItem | null>(
    null
  );
  const itemInput = useUncontrolledTextInput();
  const notesInput = useUncontrolledTextInput();
  const {
    inputKey: itemInputKey,
    defaultValue: itemInputDefaultValue,
    valueRef: itemInputValueRef,
    handleChangeText: handleItemInputTextChange,
    getValue: getItemInputValue,
    reset: resetItemInput,
    setValue: setItemInputNativeValue,
  } = itemInput;
  const {
    inputKey: notesInputKey,
    defaultValue: notesInputDefaultValue,
    valueRef: notesInputValueRef,
    handleChangeText: handleNotesInputTextChange,
    getValue: getNotesInputValue,
    reset: resetNotesInput,
    setValue: setNotesInputNativeValue,
  } = notesInput;
  const [itemInputValue, setItemInputValue] = useState('');
  const [hasItemTitle, setHasItemTitle] = useState(false);
  const [notesInputValue, setNotesInputValue] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('each');
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [initialRecipeId, setInitialRecipeId] = useState<string | undefined>(
    undefined
  );
  const [storeId, setStoreId] = useState<string | undefined>(undefined);
  const [storeName, setStoreName] = useState<string | undefined>(undefined);
  const itemInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);
  const [showMatchingItems, setShowMatchingItems] = useState(false);
  const commitItemInputValue = useDebounceCallback(
    setItemInputValue,
    TEXT_COMMIT_DEBOUNCE_MS
  );
  const commitNotesInputValue = useDebounceCallback(
    setNotesInputValue,
    TEXT_COMMIT_DEBOUNCE_MS
  );

  const reset = ({
    keepInputsMounted = false,
  }: { keepInputsMounted?: boolean } = {}) => {
    commitItemInputValue.cancel();
    commitNotesInputValue.cancel();
    setSelectedItem(null);
    // For continuous add entry we clear the text in place (setNativeProps)
    // instead of remounting via a key bump. Remounting unmounts the focused
    // input, which dismisses and re-opens the keyboard (a visible flicker).
    if (keepInputsMounted) {
      setItemInputNativeValue('', itemInputRef);
      setNotesInputNativeValue('', notesInputRef);
    } else {
      resetItemInput();
      resetNotesInput();
    }
    setItemInputValue('');
    setHasItemTitle(false);
    setNotesInputValue('');
    setCategory(undefined);
    setQuantity(1);
    setUnit('each');
    setRecipe(undefined);
    setInitialRecipeId(undefined);
    setStoreId(mode === 'add' ? defaultStore?.id : undefined);
    setStoreName(mode === 'add' ? defaultStore?.name : undefined);
    setShowMatchingItems(false);
  };

  const setFromItem = useCallback(
    (item: GroceryListItemWithRecipe | BaseGroceryItem) => {
      commitItemInputValue.cancel();
      commitNotesInputValue.cancel();
      setSelectedItem(null);
      resetItemInput(item.name);
      setItemInputValue(item.name);
      setHasItemTitle(item.name.trim().length > 0);
      setCategory(item.category);
      setQuantity(item.quantity);
      setUnit(item.unit);
      resetNotesInput(item.notes ?? '');
      setNotesInputValue(item.notes ?? '');
      // Handle recipe - only available on GroceryListItemWithRecipe
      if ('recipe' in item) {
        setRecipe(item.recipe);
        setInitialRecipeId(item.recipe?.id);
      }
      // Always derive store state from the incoming item so edit sheets don't
      // keep stale store selection between items.
      const derivedStoreId =
        ('store' in item ? item.store?.id : undefined) ??
        ('storeId' in item ? item.storeId : undefined) ??
        ('saved_item' in item ? item.saved_item?.store?.id : undefined);
      const derivedStoreName =
        ('store' in item ? item.store?.name : undefined) ??
        ('saved_item' in item ? item.saved_item?.store?.name : undefined);
      setStoreId(derivedStoreId);
      setStoreName(derivedStoreName);
      setShowMatchingItems(false);
    },
    [
      commitItemInputValue,
      commitNotesInputValue,
      resetItemInput,
      resetNotesInput,
    ]
  );

  // Expose setFromItem to parent via ref
  useEffect(() => {
    if (setFromItemRef) {
      setFromItemRef.current = (
        item: GroceryListItemWithRecipe | BaseGroceryItem
      ) => setFromItem(item);
    }
  }, [setFromItem, setFromItemRef]);

  // Check if recipe was cleared (had initial recipe, now undefined/null)
  const recipeCleared = !!initialRecipeId && !recipe;

  const submitItem = () => {
    // Mirror the footer button's `disabled={!isValid}` guard. The button is
    // gated on `isValid`, but the return key routes here directly, so without
    // this check pressing enter on an empty field would create a blank item.
    // Read the live input value (not the debounced `itemInputValue`) so a
    // fast enter press right after typing is still validated correctly.
    if (!getItemInputValue().trim().length || !quantity || !unit) {
      return;
    }

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
        name: getItemInputValue(),
        category: category,
        quantity: quantity,
        unit: unit,
        notes: getNotesInputValue(),
        storeId: storeId,
      },
      clearedRecipeId: recipeCleared ? initialRecipeId : undefined,
      selectedCloudSavedItemId,
      selectedCloudSavedItemStoreId,
      selectedLocalSavedItemId,
    });
    // In add mode the sheet stays open for continuous entry. Clear the inputs
    // in place (no remount) so the field keeps focus and the keyboard stays up
    // until the user dismisses it manually.
    if (mode === 'add') {
      reset({ keepInputsMounted: true });
      itemInputRef.current?.focus();
    } else {
      reset();
    }
  };

  const onSelect = (item: MatchingItem) => {
    commitItemInputValue.cancel();
    commitNotesInputValue.cancel();
    setSelectedItem(item);
    setItemInputNativeValue(item.name, itemInputRef);
    setItemInputValue(item.name);
    setHasItemTitle(item.name.trim().length > 0);
    setCategory(item.category);
    resetNotesInput(item.notes ?? '');
    setNotesInputValue(item.notes ?? '');
      const defaultStoreId = mode === 'add' ? defaultStore?.id : undefined;
      const defaultStoreName = mode === 'add' ? defaultStore?.name : undefined;
      setStoreId(item.storeId ?? defaultStoreId);
      setStoreName(item.storeId ? undefined : defaultStoreName);
    setShowMatchingItems(false);
    // Notify observers (e.g. useLiveItemSync in the Edit flow) on the next
    // macrotask so React can commit the state updates above first. This keeps
    // downstream snapshot/rebase logic aligned with the picked form values.
    setTimeout(() => {
      onPickMatch?.(item);
    }, 0);
  };

  const onChangeItemText = (text: string) => {
    handleItemInputTextChange(text);
    setSelectedItem(null);
    setHasItemTitle(text.trim().length > 0);
    commitItemInputValue(text);
    setShowMatchingItems(true);
  };
  const onChangeNotesText = (text: string) => {
    handleNotesInputTextChange(text);
    commitNotesInputValue(text);
  };

  return (
    <itemSheetContext.Provider
      value={{
        onSelect,
        selectedItem,
        setSelectedItem,
        onSubmit: submitItem,
        itemInputValue,
        hasItemTitle,
        itemInputKey,
        itemInputDefaultValue,
        itemInputValueRef,
        itemInputRef,
        notesInputValue,
        notesInputKey,
        notesInputDefaultValue,
        notesInputValueRef,
        notesInputRef,
        getItemInputValue,
        getNotesInputValue,
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
        listId,
        storeId,
        setStoreId,
        storeName,
        setStoreName,
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
