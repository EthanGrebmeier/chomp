import React, { createContext, useContext, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { normalizeUnit } from '../../../components/item-sheet/unit-utils';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { BaseGroceryItem } from '../../grocery-list/types';

type MealPlanItemContextValue = {
  // Item state
  itemName: string;
  hasItemTitle: boolean;
  setItemName: (name: string) => void;
  itemNameInputKey: number;
  itemNameDefaultValue: string;
  getItemName: () => string;
  itemNotes: string;
  setItemNotes: (notes: string) => void;
  itemNotesInputKey: number;
  itemNotesDefaultValue: string;
  getItemNotes: () => string;
  quantity: number;
  setQuantity: (quantity: number) => void;
  unit: string;
  setUnit: (unit: string) => void;
  category: string | undefined;
  setCategory: (category: string | undefined) => void;
  storeId: string | undefined;
  setStoreId: (storeId: string | undefined) => void;
  selectedDate: string | undefined;
  setSelectedDate: (date: string | undefined) => void;
  mealTag: string | undefined;
  setMealTag: (mealTag: string | undefined) => void;
  showMatchingItems: boolean;
  setShowMatchingItems: (show: boolean) => void;

  // Helper methods
  resetState: () => void;
  populateFromItem: (item: BaseGroceryItem) => void;
  isValid: () => boolean;
};

const MealPlanItemContext = createContext<MealPlanItemContextValue | undefined>(
  undefined
);

const TEXT_COMMIT_DEBOUNCE_MS = 150;

export type MealPlanItemInitialValues = {
  itemName?: string;
  itemNotes?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  storeId?: string;
  selectedDate?: string;
  mealTag?: string;
};

type MealPlanItemProviderProps = {
  children: React.ReactNode;
  initialValues?: MealPlanItemInitialValues;
};

export const MealPlanItemProvider = ({
  children,
  initialValues,
}: MealPlanItemProviderProps) => {
  const initialItemName = initialValues?.itemName ?? '';
  const initialItemNotes = initialValues?.itemNotes ?? '';
  const itemNameInput = useUncontrolledTextInput(initialItemName);
  const itemNotesInput = useUncontrolledTextInput(initialItemNotes);
  const [itemName, setCommittedItemName] = useState(initialItemName);
  const [hasItemTitle, setHasItemTitle] = useState(
    initialItemName.trim().length > 0
  );
  const [itemNotes, setCommittedItemNotes] = useState(initialItemNotes);
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? 1);
  const [unit, setUnit] = useState(normalizeUnit(initialValues?.unit));
  const [category, setCategory] = useState<string | undefined>(
    initialValues?.category
  );
  const [storeId, setStoreId] = useState<string | undefined>(
    initialValues?.storeId
  );
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    initialValues?.selectedDate
  );
  const [mealTag, setMealTag] = useState<string | undefined>(
    initialValues?.mealTag
  );
  const [showMatchingItems, setShowMatchingItems] = useState(false);
  const commitItemName = useDebounceCallback(
    setCommittedItemName,
    TEXT_COMMIT_DEBOUNCE_MS
  );
  const commitItemNotes = useDebounceCallback(
    setCommittedItemNotes,
    TEXT_COMMIT_DEBOUNCE_MS
  );

  const setItemName = (name: string) => {
    itemNameInput.handleChangeText(name);
    setHasItemTitle(name.trim().length > 0);
    commitItemName(name);
  };

  const setItemNotes = (notes: string) => {
    itemNotesInput.handleChangeText(notes);
    commitItemNotes(notes);
  };

  const resetState = () => {
    commitItemName.cancel();
    commitItemNotes.cancel();
    itemNameInput.reset();
    itemNotesInput.reset();
    setCommittedItemName('');
    setHasItemTitle(false);
    setCommittedItemNotes('');
    setQuantity(1);
    setUnit('each');
    setCategory(undefined);
    setStoreId(undefined);
    setSelectedDate(undefined);
    setMealTag(undefined);
    setShowMatchingItems(false);
  };

  const populateFromItem = (item: BaseGroceryItem) => {
    commitItemName.cancel();
    itemNameInput.reset(item.name);
    setCommittedItemName(item.name);
    setHasItemTitle(item.name.trim().length > 0);
    setUnit(normalizeUnit(item.unit));
    if (item.category) setCategory(item.category);
    setShowMatchingItems(false);
  };

  const isValid = () => {
    return itemNameInput.getValue().trim().length > 0 && selectedDate !== undefined;
  };

  const value: MealPlanItemContextValue = {
    itemName,
    hasItemTitle,
    setItemName,
    itemNameInputKey: itemNameInput.inputKey,
    itemNameDefaultValue: itemNameInput.defaultValue,
    getItemName: itemNameInput.getValue,
    itemNotes,
    setItemNotes,
    itemNotesInputKey: itemNotesInput.inputKey,
    itemNotesDefaultValue: itemNotesInput.defaultValue,
    getItemNotes: itemNotesInput.getValue,
    quantity,
    setQuantity,
    unit,
    setUnit,
    category,
    setCategory,
    storeId,
    setStoreId,
    selectedDate,
    setSelectedDate,
    mealTag,
    setMealTag,
    showMatchingItems,
    setShowMatchingItems,
    resetState,
    populateFromItem,
    isValid,
  };

  return (
    <MealPlanItemContext.Provider value={value}>
      {children}
    </MealPlanItemContext.Provider>
  );
};

export const useMealPlanItem = () => {
  const context = useContext(MealPlanItemContext);
  if (!context) {
    throw new Error(
      'useMealPlanItem must be used within a MealPlanItemProvider'
    );
  }
  return context;
};
