import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { useUpdateMealPlanItem } from '../hooks/useUpdateMealPlanItem';
import { MealPlanItemWithStore } from '../types';

import { MealItemDropdownMenu } from './meal-item-dropdown-menu';
import {
  MealPlanItemInitialValues,
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanMetaBar } from './meal-plan-meta-bar';

export type EditItemSheetRef = {
  open: (item: MealPlanItemWithStore) => void;
};

const EditItemSheetContent = ({
  itemToEdit,
  onClose,
}: {
  itemToEdit: MealPlanItemWithStore | null;
  onClose: () => void;
}) => {
  const {
    itemName,
    itemNameInputKey,
    itemNameDefaultValue,
    getItemName,
    setItemName,
    itemNotesInputKey,
    itemNotesDefaultValue,
    setItemNotes,
    showMatchingItems,
    setShowMatchingItems,
    populateFromItem,
  } = useMealPlanItem();

  const itemInputRef = useRef<TextInput>(null);
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();

  const handleRemoveItem = () => {
    if (!itemToEdit) return;
    const currentItemName = getItemName();

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${currentItemName}" from your meal plan?`,
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
    <View className="gap-4">
      <View className="w-full flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <ItemInput
            placeholder="Item name"
            inputKey={itemNameInputKey}
            defaultValue={itemNameDefaultValue}
            matchingValue={itemName}
            onChangeText={text => {
              setItemName(text);
              setShowMatchingItems(true);
            }}
            onSelect={item => {
              populateFromItem(item);
              itemInputRef.current?.blur();
            }}
            showMatchingItems={showMatchingItems}
            setShowMatchingItems={setShowMatchingItems}
            onSubmit={() => {}}
            inputRef={itemInputRef}
          />
        </View>
        <MealItemDropdownMenu itemName={itemName} onRemove={handleRemoveItem} />
      </View>

      <View className="gap-4">
        <BottomSheet.BareTextInput
          key={itemNotesInputKey}
          className="min-h-24 text-base text-foreground"
          placeholder="Notes"
          defaultValue={itemNotesDefaultValue}
          onChangeText={setItemNotes}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );
};

const EditItemSheetContainer = ({
  sheetRef,
  itemToEdit,
  onClose,
  onReset,
}: {
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
    isValid,
  } = useMealPlanItem();
  const { mutate: updateMealPlanItem } = useUpdateMealPlanItem();
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const getCurrentUpdates = () => ({
    name: getItemName().trim(),
    quantity,
    unit,
    notes: getItemNotes().trim() || undefined,
    category,
    storeId,
    date: selectedDate,
    mealTag,
  });

  const persistChanges = () => {
    if (!itemToEdit || !isValid()) return;

    const updates = getCurrentUpdates();
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
  };

  const scheduleAutoSave = () => {
    if (!itemToEdit || !isValid()) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      persistChanges();
    }, 350);
  };

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
      notes: itemToEdit.notes?.trim() || undefined,
      category: itemToEdit.category ?? undefined,
      storeId: itemToEdit.store?.id ?? undefined,
      date: itemToEdit.date,
      mealTag: itemToEdit.mealTag ?? undefined,
    });
  }, [itemToEdit]);

  useEffect(() => {
    if (!itemToEdit || !isValid()) return;
    scheduleAutoSave();
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    category,
    getItemName,
    getItemNotes,
    isValid,
    itemName,
    itemNotes,
    itemToEdit,
    mealTag,
    quantity,
    selectedDate,
    storeId,
    unit,
  ]);

  return (
    <BottomSheet
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        flushAutoSave();
        onReset();
      }}
      footer={
        itemToEdit ? (
          <View className="px-4 pb-safe">
            <MealPlanMetaBar
              date={selectedDate}
              onDateChange={setSelectedDate}
              mealTag={mealTag}
              onMealTagChange={setMealTag}
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
            />
          </View>
        ) : undefined
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        {itemToEdit && (
          <EditItemSheetContent
            itemToEdit={itemToEdit}
            onClose={onClose}
          />
        )}
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

export const EditItemSheet = forwardRef<EditItemSheetRef>((_, ref) => {
  const [itemToEdit, setItemToEdit] = useState<MealPlanItemWithStore | null>(
    null
  );
  const [initialValues, setInitialValues] = useState<
    MealPlanItemInitialValues | undefined
  >(undefined);
  const [shouldPresent, setShouldPresent] = useState(false);

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
      setShouldPresent(true);
    },
  }));

  // Present the sheet after state has committed and the provider has remounted
  // with the correct initial values (mirroring EditMealSheet's forwardRef pattern).
  useEffect(() => {
    if (shouldPresent) {
      sheetRef.current?.present();
      setShouldPresent(false);
    }
  }, [shouldPresent]);

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
        sheetRef={sheetRef}
        itemToEdit={itemToEdit}
        onClose={handleClose}
        onReset={handleReset}
      />
    </MealPlanItemProvider>
  );
});

EditItemSheet.displayName = 'EditItemSheet';
