import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BaseGroceryItem } from '../../grocery-list/types';

import { useMealPlanItem } from './meal-plan-item-context';
import { MealPlanItemInput } from './meal-plan-item-input';
import { MealPlanMetaBar } from './meal-plan-meta-bar';

type MealPlanItemFormProps = {
  onSubmit: () => void;
  autoFocus?: boolean;
  notesPlaceholder?: string;
  notesStyle?: 'inline' | 'bordered';
};

export const MealPlanItemForm = ({
  onSubmit,
  autoFocus = false,
  notesPlaceholder = 'Notes',
  notesStyle = 'inline',
}: MealPlanItemFormProps) => {
  const itemInputRef = useRef<TextInput>(null);
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

  const handleItemTextChange = (text: string) => {
    setItemName(text);
    setShowMatchingItems(true);
  };

  const handleSelectSavedItem = (item: BaseGroceryItem) => {
    populateFromItem(item);
    itemInputRef.current?.blur();
  };

  // Auto-focus if requested
  React.useEffect(() => {
    if (autoFocus) {
      setTimeout(() => itemInputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const notesClassName =
    notesStyle === 'inline'
      ? 'min-h-36 flex-1 text-start text-lg font-bold text-foreground'
      : 'min-h-24 rounded-md border border-border bg-card px-3 py-2 text-base text-foreground';

  return (
    <View className="flex-1">
      <MealPlanItemInput
        ref={itemInputRef}
        value={itemName}
        onChangeText={handleItemTextChange}
        onSelect={handleSelectSavedItem}
        showMatchingItems={showMatchingItems}
        setShowMatchingItems={setShowMatchingItems}
        onSubmit={onSubmit}
      />
      <BottomSheet.BareTextInput
        value={itemNotes}
        onChangeText={setItemNotes}
        placeholder={notesPlaceholder}
        multiline
        style={{ textAlignVertical: 'top' }}
        className={notesClassName}
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
      />
    </View>
  );
};
