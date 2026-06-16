import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import { BaseGroceryItem } from '../../grocery-list/types';

import { useMealPlanItem } from './meal-plan-item-context';
import { MealPlanMetaBar } from './meal-plan-meta-bar';

type MealPlanItemFormProps = {
  onSubmit: () => void;
  autoFocus?: boolean;
  notesPlaceholder?: string;
  notesStyle?: 'inline' | 'bordered';
  showMetaBar?: boolean;
};

export const MealPlanItemForm = ({
  onSubmit,
  autoFocus = false,
  notesPlaceholder = 'Notes',
  notesStyle = 'inline',
  showMetaBar = true,
}: MealPlanItemFormProps) => {
  const itemInputRef = useRef<TextInput>(null);
  const {
    itemName,
    hasItemTitle,
    itemNameInputKey,
    itemNameDefaultValue,
    setItemName,
    itemNotesInputKey,
    itemNotesDefaultValue,
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
      ? 'min-h-44 text-start text-lg font-bold text-foreground'
      : 'min-h-24 rounded-md border border-border bg-card px-3 py-2 text-base text-foreground';

  return (
    <View>
      <ItemInput
        placeholder="Item name"
        inputKey={itemNameInputKey}
        defaultValue={itemNameDefaultValue}
        matchingValue={itemName}
        onChangeText={handleItemTextChange}
        onSelect={handleSelectSavedItem}
        showMatchingItems={showMatchingItems}
        setShowMatchingItems={setShowMatchingItems}
        onSubmit={onSubmit}
        inputRef={itemInputRef}
      />
      <BottomSheet.BareTextInput
        key={itemNotesInputKey}
        defaultValue={itemNotesDefaultValue}
        onChangeText={setItemNotes}
        placeholder={notesPlaceholder}
        multiline
        style={{ textAlignVertical: 'top' }}
        className={notesClassName}
      />
      {showMetaBar ? (
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
          optionsDisabled={!hasItemTitle}
        />
      ) : null}
    </View>
  );
};
