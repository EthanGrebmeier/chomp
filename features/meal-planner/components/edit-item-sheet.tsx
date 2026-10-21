import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { ItemComposerCard } from '../../../components/item-sheet/item-composer-card';
import { ItemSuggestions } from '../../../components/item-sheet/item-suggestions';
import { useMealPlanOnlyToggle } from '../hooks/useMealPlanOnlyToggle';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { useUpdateMealPlanItem } from '../hooks/useUpdateMealPlanItem';
import { useUserMealPlanData } from '../hooks/useUserMealPlanData';
import { MealPlanItemWithStore } from '../types';
import { getMealPlanShoppingState } from '../utils/shopping-state';
import {
  countUncheckedLinkedGroceryItems,
  withUncheckedLinkedGroceryItemsNotice,
} from '../utils/unchecked-linked-grocery-items';

import { MealItemDropdownMenu } from './meal-item-dropdown-menu';
import {
  MealPlanItemInitialValues,
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemForm } from './meal-plan-item-form';
import { MealPlanMetaBar } from './meal-plan-meta-bar';
import { AddToGroceryListSwitch } from './meal-plan-only';

export type EditItemSheetRef = {
  open: (item: MealPlanItemWithStore) => void;
};

type EditItemSheetProps = {
  listId: string;
};

const EditItemSheetContent = ({
  listId,
  itemToEdit,
  onClose,
  inputRef,
}: EditItemSheetProps & {
  itemToEdit: MealPlanItemWithStore;
  onClose: () => void;
  inputRef: React.RefObject<TextInput | null>;
}) => {
  const {
    itemName,
    getItemName,
    quantity,
    setQuantity,
    unit,
    setUnit,
    category,
    setCategory,
    storeId,
    setStoreId,
    hasItemTitle,
    isValid,
  } = useMealPlanItem();
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();
  // Shared with the planner view, so "meal plan only" stays live.
  const { items: mealPlanItems, isLoading } = useUserMealPlanData(listId);
  const liveItem =
    mealPlanItems.find(item => item.id === itemToEdit.id) ?? itemToEdit;
  const shoppingState = getMealPlanShoppingState(liveItem);
  const {
    isMealPlanOnly: mealPlanOnly,
    setMealPlanOnly,
    isPending,
  } = useMealPlanOnlyToggle({
    entry: { type: 'item', id: itemToEdit.id },
    isMealPlanOnly: !shoppingState.isShownOnGroceryList,
  });

  const switchDescription = shoppingState.allPurchased
    ? mealPlanOnly
      ? 'Purchased. Turning this on adds this item again.'
      : 'Purchased. Turning this off hides the item and keeps purchase history.'
    : undefined;

  const handleRemoveItem = () => {
    const currentItemName = getItemName();

    Alert.alert(
      'Delete Item',
      withUncheckedLinkedGroceryItemsNotice(
        `Are you sure you want to delete "${currentItemName}" from your meal plan?`,
        countUncheckedLinkedGroceryItems({ items: [itemToEdit] })
      ),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeItemFromMealPlan(
              {
                mealPlanItemId: itemToEdit.id,
              },
              {
                onSuccess: () => {
                  onClose();
                },
                onError: () => {
                  toast.error('Failed to delete item');
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <MealPlanItemForm
      compact
      inputRef={inputRef}
      onSubmit={() => inputRef.current?.blur()}
      showMetaBar={false}
      renderContent={(fields, suggestions) => (
        <View className="px-2" style={{ paddingBottom: 24 }}>
          <ItemSuggestions onClose={onClose} label="Close meal-plan item">
            {suggestions}
          </ItemSuggestions>
          <ItemComposerCard
            title="Edit meal-plan item"
            onClose={onClose}
            headerActions={
              <MealItemDropdownMenu
                itemName={itemName}
                onRemove={handleRemoveItem}
              />
            }
            metadata={
              <MealPlanMetaBar
                quantity={quantity}
                onQuantityChange={setQuantity}
                unit={unit}
                onUnitChange={setUnit}
                category={category}
                onCategoryChange={setCategory}
                storeId={storeId}
                onStoreIdChange={setStoreId}
                onSubmit={() => {}}
                isValid={isValid()}
                showAction={false}
                optionsDisabled={!hasItemTitle}
              />
            }
          >
            {fields}
            <AddToGroceryListSwitch
              className="py-2"
              isMealPlanOnly={mealPlanOnly}
              onMealPlanOnlyChange={setMealPlanOnly}
              disabled={isPending || isLoading}
              description={switchDescription}
            />
          </ItemComposerCard>
        </View>
      )}
    />
  );
};

const getSnapshot = (updates: {
  name?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date?: string;
  mealTag?: string;
}) =>
  JSON.stringify({
    name: updates.name ?? null,
    quantity: updates.quantity ?? null,
    unit: updates.unit ?? null,
    notes: updates.notes ?? null,
    category: updates.category ?? null,
    storeId: updates.storeId ?? null,
    date: updates.date ?? null,
    mealTag: updates.mealTag ?? null,
  });

const EditItemSheetContainer = ({
  listId,
  sheetRef,
  itemToEdit,
  onClose,
  onReset,
}: EditItemSheetProps & {
  sheetRef: React.RefObject<TrueSheet | null>;
  itemToEdit: MealPlanItemWithStore | null;
  onClose: () => void;
  onReset: () => void;
}) => {
  const {
    itemName,
    itemNotes,
    getItemName,
    getItemNotes,
    quantity,
    unit,
    category,
    storeId,
    selectedDate,
    mealTag,
  } = useMealPlanItem();
  const itemInputRef = useRef<TextInput>(null);
  const { mutate: updateMealPlanItem } = useUpdateMealPlanItem();
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistChanges = useCallback(() => {
    if (!itemToEdit || !selectedDate) return;
    const updates = {
      name: getItemName().trim(),
      quantity,
      unit,
      notes: getItemNotes().trim() || undefined,
      category,
      storeId,
      date: selectedDate,
      mealTag,
    };
    if (!updates.name) return;
    const snapshot = getSnapshot(updates);
    if (snapshot === lastSyncedSnapshotRef.current) return;

    updateMealPlanItem(
      {
        mealPlanItemId: itemToEdit.id,
        updates,
      },
      {
        onSuccess: () => {
          lastSyncedSnapshotRef.current = snapshot;
        },
        onError: () => {
          toast.error('Failed to update item');
        },
      }
    );
  }, [
    itemToEdit,
    selectedDate,
    getItemName,
    getItemNotes,
    quantity,
    unit,
    category,
    storeId,
    mealTag,
    updateMealPlanItem,
  ]);

  const flushAutoSave = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    persistChanges();
  };

  useEffect(() => {
    if (!itemToEdit) return;
    lastSyncedSnapshotRef.current = getSnapshot({
      name: itemToEdit.name.trim(),
      quantity: itemToEdit.quantity,
      unit: itemToEdit.unit,
      notes: itemToEdit.notes?.trim() ? itemToEdit.notes.trim() : undefined,
      category: itemToEdit.category ?? undefined,
      storeId: itemToEdit.store?.id ?? undefined,
      date: itemToEdit.date,
      mealTag: itemToEdit.mealTag ?? undefined,
    });
  }, [itemToEdit]);

  useEffect(() => {
    updateTimeoutRef.current = setTimeout(persistChanges, 350);
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [persistChanges, itemName, itemNotes]);

  return (
    <TrueSheet
      name="edit-meal-plan-item-sheet"
      ref={sheetRef}
      detents={['auto']}
      draggable={false}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
      elevation={0}
      insetAdjustment="never"
      onWillPresent={() => itemInputRef.current?.focus()}
      onWillFocus={() => itemInputRef.current?.focus()}
      onWillDismiss={flushAutoSave}
      onDidDismiss={onReset}
    >
      {itemToEdit ? (
        <EditItemSheetContent
          listId={listId}
          itemToEdit={itemToEdit}
          onClose={onClose}
          inputRef={itemInputRef}
        />
      ) : null}
    </TrueSheet>
  );
};

export const EditItemSheet = forwardRef<EditItemSheetRef, EditItemSheetProps>(
  ({ listId }, ref) => {
    const [itemToEdit, setItemToEdit] = useState<MealPlanItemWithStore | null>(
      null
    );
    const [initialValues, setInitialValues] = useState<
      MealPlanItemInitialValues | undefined
    >(undefined);
    const [openRequest, setOpenRequest] = useState(0);

    const sheetRef = useRef<TrueSheet>(null);

    useImperativeHandle(ref, () => ({
      open: (item: MealPlanItemWithStore) => {
        setItemToEdit(item);
        setInitialValues({
          itemName: item.name,
          itemNotes: item.notes ?? '',
          quantity: item.quantity,
          unit: item.unit,
          category: item.category ?? undefined,
          storeId: item.store?.id ?? undefined,
          selectedDate: item.date,
          mealTag: item.mealTag ?? undefined,
        });
        setOpenRequest(request => request + 1);
      },
    }));

    // Present the sheet after state has committed and the provider has remounted
    // with the correct initial values (mirroring EditMealSheet's forwardRef pattern).
    useEffect(() => {
      if (openRequest > 0) {
        sheetRef.current?.present();
      }
    }, [openRequest]);

    const handleClose = () => {
      sheetRef.current?.dismiss();
    };

    const handleReset = () => {
      setItemToEdit(null);
      setInitialValues(undefined);
    };

    return (
      <MealPlanItemProvider
        key={itemToEdit?.id ?? 'meal-plan-item'}
        initialValues={initialValues}
      >
        <EditItemSheetContainer
          listId={listId}
          sheetRef={sheetRef}
          itemToEdit={itemToEdit}
          onClose={handleClose}
          onReset={handleReset}
        />
      </MealPlanItemProvider>
    );
  }
);

EditItemSheet.displayName = 'EditItemSheet';
