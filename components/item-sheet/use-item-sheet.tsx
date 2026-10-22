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
import { useSaveItemPreference } from '../../features/saved-items/hooks/use-save-item-preference';

import {
  hasSavedItemLink,
  keepSelectedItemForTitle,
} from './saved-item-intent';
import { MatchingItem } from './use-matching-items';

const itemSheetContext = createContext<{
  onSelect: (item: MatchingItem) => void;
  selectedItem: MatchingItem | null;
  setSelectedItem: (item: MatchingItem | null) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
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
  saveItem: boolean;
  setSaveItem: (saveItem: boolean) => void;
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
  preferDefaultStore?: boolean;
  onSubmit: (args: {
    item: BaseGroceryItem;
    listId?: string;
    clearedRecipeId?: string;
    selectedCloudSavedItemId?: string;
    selectedCloudSavedItemStoreId?: string;
    selectedLocalSavedItemId?: string;
    saveItem?: boolean;
  }) => void | boolean | Promise<void | boolean>;
  setFromItemRef?: React.RefObject<
    ((item: GroceryListItemWithRecipe | BaseGroceryItem) => void) | null
  >;
  disableAutocomplete?: boolean;
  /**
   * Optional observer fired after the shared form state has been populated
   * from an autocomplete pick.
   */
  onPickMatch?: (match: MatchingItem) => void;
};

export const ItemSheetProvider = ({
  children,
  listId,
  defaultStore,
  preferDefaultStore = false,
  onSubmit,
  setFromItemRef,
  disableAutocomplete = false,
  mode,
  onPickMatch,
}: ItemSheetProviderProps) => {
  const [selectedItem, setSelectedItem] = useState<MatchingItem | null>(null);
  const itemInput = useUncontrolledTextInput();
  const notesInput = useUncontrolledTextInput();
  const {
    inputKey: itemInputKey,
    defaultValue: itemInputDefaultValue,
    valueRef: itemInputValueRef,
    handleChangeText: handleItemInputTextChange,
    getValue: getItemInputValue,
    reset: resetItemInput,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveItem: saveNewItem, setSaveItem: setSaveNewItem } =
    useSaveItemPreference();
  const [syncSavedItem, setSyncSavedItem] = useState(false);
  const isSync = hasSavedItemLink(selectedItem);
  const saveItem = isSync ? syncSavedItem : saveNewItem;
  const setSaveItem = isSync ? setSyncSavedItem : setSaveNewItem;
  const commitNotesInputValue = useDebounceCallback(
    setNotesInputValue,
    TEXT_COMMIT_DEBOUNCE_MS
  );

  const reset = ({
    keepInputsMounted = false,
  }: { keepInputsMounted?: boolean } = {}) => {
    commitNotesInputValue.cancel();
    setSelectedItem(null);
    setSyncSavedItem(false);
    // For continuous add entry we clear the text in place
    // instead of remounting via a key bump. Remounting unmounts the focused
    // input, which dismisses and re-opens the keyboard (a visible flicker).
    if (keepInputsMounted) {
      handleItemInputTextChange('');
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
      commitNotesInputValue.cancel();
      setSelectedItem(null);
      setSyncSavedItem(false);
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
    [commitNotesInputValue, resetItemInput, resetNotesInput]
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

  const submitItem = async () => {
    // Mirror the footer button's `disabled={!isValid}` guard. The button is
    // gated on `isValid`, but the return key routes here directly, so without
    // this check pressing enter on an empty field would create a blank item.
    // Read the live input ref so a fast return-key press is validated even
    // before React commits the latest title render.
    if (
      isSubmitting ||
      !getItemInputValue().trim().length ||
      !quantity ||
      !unit
    ) {
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

    setIsSubmitting(true);
    const didSubmit = await Promise.resolve()
      .then(() =>
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
          saveItem,
        })
      )
      .catch(() => false);
    setIsSubmitting(false);

    if (didSubmit === false) {
      return;
    }
    // In add mode the sheet stays open for continuous entry. Clear the inputs
    // in place (no remount) so the field keeps focus and the keyboard stays up
    // until the user dismisses it manually.
    if (mode === 'add') {
      reset({ keepInputsMounted: true });
      itemInputRef.current?.focus();
    }
    // Edit sheets reset on dismissal so the closing card keeps its contents.
  };

  const onSelect = (item: MatchingItem) => {
    commitNotesInputValue.cancel();
    setSelectedItem(item);
    setSyncSavedItem(false);
    handleItemInputTextChange(item.name);
    setItemInputValue(item.name);
    setHasItemTitle(item.name.trim().length > 0);
    setCategory(item.category);
    // Keep the native multiline input mounted so picking a suggestion does
    // not restart its height measurement inside the auto-sized add sheet.
    setNotesInputNativeValue(item.notes ?? '', notesInputRef);
    setNotesInputValue(item.notes ?? '');
    const defaultStoreId = mode === 'add' ? defaultStore?.id : undefined;
    const defaultStoreName = mode === 'add' ? defaultStore?.name : undefined;
    setStoreId(
      preferDefaultStore ? defaultStoreId : (item.storeId ?? defaultStoreId)
    );
    setStoreName(
      preferDefaultStore
        ? defaultStoreName
        : item.storeId
          ? undefined
          : defaultStoreName
    );
    setShowMatchingItems(false);
    // Notify observers on the next
    // macrotask so React can commit the state updates above first. This keeps
    // downstream snapshot/rebase logic aligned with the picked form values.
    setTimeout(() => {
      onPickMatch?.(item);
    }, 0);
  };

  const onChangeItemText = (text: string) => {
    handleItemInputTextChange(text);
    setSelectedItem(current => keepSelectedItemForTitle(current, text));
    setHasItemTitle(text.trim().length > 0);
    setItemInputValue(text);
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
        isSubmitting,
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
        saveItem,
        setSaveItem,
      }}
    >
      {children}
    </itemSheetContext.Provider>
  );
};
