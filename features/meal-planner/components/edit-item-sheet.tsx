import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
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
  onSubmit,
}: {
  itemToEdit: MealPlanItemWithStore | null;
  onClose: () => void;
  onSubmit: () => void;
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
  const { mutate: removeItemFromMealPlan } = useRemoveItemFromMealPlan();

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
          <ItemInput
            placeholder="Item name"
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
            onSubmit={onSubmit}
            inputRef={itemInputRef}
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
          onSubmit={onSubmit}
          isValid={isValid()}
          showAction={false}
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
    quantity,
    unit,
    category,
    storeId,
    selectedDate,
    mealTag,
    isValid,
  } = useMealPlanItem();
  const { mutate: updateMealPlanItem } = useUpdateMealPlanItem();

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
        onError: () => {
          toast.error('Failed to update item');
        },
      }
    );
  };

  return (
    <BottomSheet
      name="edit-item-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        onReset();
      }}
      footer={
        itemToEdit ? (
          <View className="px-10 pb-4">
            <Button onPress={handleUpdateItem} disabled={!isValid()}>
              <Text>Update Item</Text>
            </Button>
          </View>
        ) : undefined
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        {itemToEdit && (
          <EditItemSheetContent
            itemToEdit={itemToEdit}
            onClose={onClose}
            onSubmit={handleUpdateItem}
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
