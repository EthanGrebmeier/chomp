import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { useRemoveItemFromMealPlan } from '../hooks/useRemoveItemFromMealPlan';
import { useUpdateMealPlanItem } from '../hooks/useUpdateMealPlanItem';
import { MealPlanItemWithStore } from '../types';

import { MealItemDropdownMenu } from './meal-item-dropdown-menu';
import {
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemInput } from './meal-plan-item-input';
import { MealPlanMetaBar } from './meal-plan-meta-bar';

type EditItemSheetProps = {
  startDate: string;
  endDate: string;
  sheetRef?: React.RefObject<EditItemSheetRef | null>;
};

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
    populateFromItem,
    isValid,
  } = useMealPlanItem();

  const itemInputRef = useRef<TextInput>(null);
  const { mutate: updateMealPlanItem } = useUpdateMealPlanItem();
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();

  const handleUpdateItem = () => {
    if (!itemToEdit || !isValid()) return;

    updateMealPlanItem(
      {
        mealPlanItemId: itemToEdit.id,
        updates: {
          name: itemName.trim(),
          quantity,
          unit,
          notes: itemNotes.trim() || undefined,
          category,
          storeId,
          date: selectedDate,
          mealTag,
        },
      },
      {
        onSuccess: () => {
          toast.success('Item updated');
          onClose();
        },
        onError: error => {
          toast.error('Failed to update item');
        },
      }
    );
  };

  const handleRemoveItem = () => {
    if (!itemToEdit) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}" from your meal plan?`,
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
                  toast.success('Item deleted');
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
          <MealPlanItemInput
            ref={itemInputRef}
            value={itemName}
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
            onSubmit={handleUpdateItem}
          />
        </View>
        <MealItemDropdownMenu itemName={itemName} onRemove={handleRemoveItem} />
      </View>

      <View className="gap-4">
        <BottomSheet.BareTextInput
          className="min-h-24 text-base text-foreground"
          placeholder="Notes"
          value={itemNotes}
          onChangeText={setItemNotes}
          multiline
          textAlignVertical="top"
        />

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
          onSubmit={handleUpdateItem}
          isValid={isValid()}
        />
      </View>
    </View>
  );
};

export const EditItemSheet = ({
  startDate,
  endDate,
  sheetRef: externalRef,
}: EditItemSheetProps) => {
  const [itemToEdit, setItemToEdit] = useState<MealPlanItemWithStore | null>(
    null
  );
  const [initialValues, setInitialValues] = useState<any>(undefined);

  const sheetRef = useRef<TrueSheet>(null);

  // Set up the ref interface
  useEffect(() => {
    if (externalRef) {
      externalRef.current = {
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
          sheetRef.current?.present();
        },
      };
    }
  }, [externalRef]);

  const handleClose = () => {
    sheetRef.current?.dismiss();
  };

  const handleReset = () => {
    setItemToEdit(null);
    setInitialValues(undefined);
  };

  return (
    <BottomSheet
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        handleReset();
      }}
    >
      <BottomSheet.SheetView>
        {initialValues && (
          <MealPlanItemProvider initialValues={initialValues}>
            <EditItemSheetContent
              itemToEdit={itemToEdit}
              onClose={handleClose}
            />
          </MealPlanItemProvider>
        )}
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};
