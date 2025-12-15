import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { createContext, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemForm } from '../../../components/item-sheet/item-form';
import { MetaBar } from '../../../components/item-sheet/meta-bar';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { BaseGroceryItem } from '../../grocery-list/types';
import { addRecipeIngredient } from '../instant/add-recipe-ingredient';
import { updateRecipeIngredient } from '../instant/update-recipe-ingredient';
import { RecipeIngredient } from '../types';

type AddIngredientContextType = {
  present: (ingredient?: RecipeIngredient) => void;
};

const AddIngredientContext = createContext<AddIngredientContextType | null>(
  null
);

export const useAddIngredientSheet = () => {
  const context = useContext(AddIngredientContext);
  if (!context) {
    throw new Error(
      'useAddIngredientSheet must be used within an AddIngredientProvider'
    );
  }
  return context;
};

const AddIngredientContents = ({ submitLabel }: { submitLabel: string }) => {
  const { reset, itemInputRef } = useItemSheet();
  const { sheetRef } = useAddIngredientSheetInternal();

  return (
    <BottomSheet
      viewClassName="pb-4"
      name="add-ingredient-sheet"
      ref={sheetRef}
      onStartClose={reset}
      onOpen={() => {
        itemInputRef.current?.focus();
      }}
    >
      <View>
        <ItemForm />
        <MetaBar submitLabel={submitLabel} />
      </View>
    </BottomSheet>
  );
};

// Internal context for sharing the sheet ref
type AddIngredientInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
};

const AddIngredientInternalContext =
  createContext<AddIngredientInternalContextType | null>(null);

const useAddIngredientSheetInternal = () => {
  const context = useContext(AddIngredientInternalContext);
  if (!context) {
    throw new Error(
      'useAddIngredientSheetInternal must be used within an AddIngredientProvider'
    );
  }
  return context;
};

type AddIngredientProviderProps = {
  recipeId: string;
  children: React.ReactNode;
};

export const AddIngredientProvider = ({
  recipeId,
  children,
}: AddIngredientProviderProps) => {
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredient | null>(null);
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);

  const isEditing = !!editingIngredient;

  const onSubmit = ({ item }: { item: BaseGroceryItem }) => {
    if (isEditing && editingIngredient) {
      updateRecipeIngredient({
        ingredientId: editingIngredient.id,
        updates: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          notes: item.notes,
        },
      });
      toast.success(`${item.name} updated`);
    } else {
      addRecipeIngredient({
        recipeId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category ?? null,
        notes: item.notes,
      });
      toast.success(`${item.name} added`);
    }
    sheetRef.current?.dismiss();
  };

  const present = (ingredient?: RecipeIngredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFromItemRef.current?.({
        name: ingredient.name ?? '',
        quantity: ingredient.quantity ?? 1,
        unit: ingredient.unit ?? 'each',
        category: ingredient.category ?? undefined,
        notes: ingredient.notes ?? undefined,
      });
    } else {
      setEditingIngredient(null);
    }
    sheetRef.current?.present();
  };

  return (
    <AddIngredientContext.Provider value={{ present }}>
      <AddIngredientInternalContext.Provider value={{ sheetRef }}>
        <ItemSheetProvider onSubmit={onSubmit} setFromItemRef={setFromItemRef}>
          <AddIngredientContents
            submitLabel={isEditing ? 'Update' : 'Create'}
          />
          {children}
        </ItemSheetProvider>
      </AddIngredientInternalContext.Provider>
    </AddIngredientContext.Provider>
  );
};
