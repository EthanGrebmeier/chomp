import React, { createContext, useContext, useState } from 'react';

import { normalizeUnit } from '../../../components/item-sheet/unit-utils';
import { BaseGroceryItem } from '../../grocery-list/types';

type MealPlanItemContextValue = {
  // Item state
  itemName: string;
  setItemName: (name: string) => void;
  itemNotes: string;
  setItemNotes: (notes: string) => void;
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
  const [itemName, setItemName] = useState(initialValues?.itemName ?? '');
  const [itemNotes, setItemNotes] = useState(initialValues?.itemNotes ?? '');
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

  const resetState = () => {
    setItemName('');
    setItemNotes('');
    setQuantity(1);
    setUnit('each');
    setCategory(undefined);
    setStoreId(undefined);
    setSelectedDate(undefined);
    setMealTag(undefined);
    setShowMatchingItems(false);
  };

  const populateFromItem = (item: BaseGroceryItem) => {
    setItemName(item.name);
    setUnit(normalizeUnit(item.unit));
    if (item.category) setCategory(item.category);
    setShowMatchingItems(false);
  };

  const isValid = () => {
    return itemName.trim().length > 0 && selectedDate !== undefined;
  };

  const value: MealPlanItemContextValue = {
    itemName,
    setItemName,
    itemNotes,
    setItemNotes,
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
