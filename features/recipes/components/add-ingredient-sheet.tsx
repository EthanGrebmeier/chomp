import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemForm } from '../../../components/item-sheet/item-form';
import { MetaBar } from '../../../components/item-sheet/meta-bar';
import { normalizeUnit } from '../../../components/item-sheet/unit-utils';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { MatchingItem } from '../../../components/item-sheet/use-matching-items';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { BaseGroceryItem } from '../../grocery-list/types';
import { addRecipeIngredient } from '../instant/add-recipe-ingredient';
import { RecipeIngredient } from '../types';

import {
  EditIngredientLiveSync,
  LiveIngredientSyncHandle,
} from './edit-ingredient/edit-ingredient-live-sync';

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

const AddIngredientContents = () => {
  const { reset, itemInputRef, onSubmit, isValid, mode } = useItemSheet();
  const { sheetRef, liveSyncRef, isEditing } = useAddIngredientSheetInternal();

  // In edit mode, flush the pending debounce so the last few keystrokes
  // land before dismissal completes. Add mode has no live-sync; it just
  // resets like it did before.
  const onStartClose = useCallback(() => {
    if (isEditing) {
      liveSyncRef.current?.flush();
    }
    reset();
  }, [isEditing, liveSyncRef, reset]);

  // onDismiss fires after the sheet is fully closed. In edit mode we also
  // drop the diff snapshot so the next present() starts from a clean
  // baseline. Add mode doesn't need anything here — reset already ran in
  // onStartClose, and there's no snapshot to clear.
  const onDismiss = useCallback(() => {
    if (!isEditing) return;
    reset();
    liveSyncRef.current?.clearSnapshot();
  }, [isEditing, liveSyncRef, reset]);

  return (
    <BottomSheet
      name="add-ingredient-sheet"
      ref={sheetRef}
      onStartClose={onStartClose}
      onDismiss={onDismiss}
      onOpen={() => {
        itemInputRef.current?.focus();
      }}
      footer={
        isEditing ? undefined : (
          <View className="px-10 pb-4">
            <Button onPress={onSubmit} disabled={!isValid}>
              <Text>
                {mode === 'add' ? 'Add Ingredient' : 'Update Ingredient'}
              </Text>
            </Button>
          </View>
        )
      }
    >
      <BottomSheet.SheetView className={cn(isEditing ? undefined : 'pb-safe')}>
        <ItemForm />
        <MetaBar />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

type AddIngredientInternalContextType = {
  sheetRef: React.RefObject<TrueSheet | null>;
  liveSyncRef: React.RefObject<LiveIngredientSyncHandle | null>;
  isEditing: boolean;
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
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(
    undefined
  );
  const sheetRef = useRef<TrueSheet>(null);
  const liveSyncRef = useRef<LiveIngredientSyncHandle | null>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);

  const isEditing = !!editingIngredient;

  // In edit mode the Update Ingredient button is gone; all persistence
  // flows through useLiveIngredientSync, so onSubmit has nothing to do.
  // Add mode still runs its single-shot addRecipeIngredient path with the
  // sheet-stays-open continuous-entry behavior.
  const onSubmit = ({ item }: { item: BaseGroceryItem }) => {
    if (isEditing) return;
    addRecipeIngredient({
      recipeId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category ?? null,
      notes: item.notes,
      storeId: item.storeId,
    });
  };

  // In edit mode, route autocomplete picks through the live-sync hook so it
  // can cancel any pending text-field debounce, commit the picked fields
  // immediately, and rebase its diff snapshot to the picked target. Add
  // mode leaves onPickMatch unset so its submit-on-button flow is unchanged.
  const onPickMatch = useCallback((match: MatchingItem) => {
    liveSyncRef.current?.onPickMatch(match);
  }, []);

  const present = (ingredient?: RecipeIngredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setCurrentStoreId(ingredient.store?.id);
      setFromItemRef.current?.({
        name: ingredient.name ?? '',
        quantity: ingredient.quantity ?? 1,
        unit: normalizeUnit(ingredient.unit),
        category: ingredient.category ?? undefined,
        notes: ingredient.notes ?? undefined,
        storeId: ingredient.store?.id,
      });
      // Seed the diff baseline before the sheet presents so the first
      // render inside ItemSheetProvider can't fire a spurious live write
      // from setFromItem pushing the ingredient's values into shared form
      // state.
      liveSyncRef.current?.captureSnapshot(ingredient);
    } else {
      setEditingIngredient(null);
      setCurrentStoreId(undefined);
    }
    sheetRef.current?.present();
  };

  return (
    <AddIngredientContext.Provider value={{ present }}>
      <AddIngredientInternalContext.Provider
        value={{ sheetRef, liveSyncRef, isEditing }}
      >
        <ItemSheetProvider
          mode={isEditing ? 'update' : 'add'}
          onSubmit={onSubmit}
          setFromItemRef={setFromItemRef}
          onPickMatch={isEditing ? onPickMatch : undefined}
        >
          {isEditing ? (
            <EditIngredientLiveSync
              selectedIngredientId={editingIngredient?.id ?? null}
              currentStoreId={currentStoreId}
              liveSyncRef={liveSyncRef}
            />
          ) : null}
          <AddIngredientContents />
          {children}
        </ItemSheetProvider>
      </AddIngredientInternalContext.Provider>
    </AddIngredientContext.Provider>
  );
};
