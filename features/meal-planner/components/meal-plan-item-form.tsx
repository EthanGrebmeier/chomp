import React, { ReactNode, useRef } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemInput } from '../../../components/item-sheet/item-input';
import { BaseGroceryItem } from '../../grocery-list/types';

import { useMealPlanItem } from './meal-plan-item-context';
import { MealPlanMetaBar } from './meal-plan-meta-bar';
import { MealScheduleSentence } from './meal-schedule-sentence';

type MealPlanItemFormProps = {
  onSubmit: () => void;
  compact?: boolean;
  renderContent?: (fields: ReactNode, suggestions: ReactNode) => ReactNode;
  autoFocus?: boolean;
  notesPlaceholder?: string;
  notesStyle?: 'inline' | 'bordered';
  showMetaBar?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  keepKeyboardOnSubmit?: boolean;
};

export const MealPlanItemForm = ({
  onSubmit,
  compact = false,
  renderContent,
  autoFocus = false,
  notesPlaceholder = 'Notes',
  notesStyle = 'inline',
  showMetaBar = true,
  inputRef,
  keepKeyboardOnSubmit = false,
}: MealPlanItemFormProps) => {
  const internalItemInputRef = useRef<TextInput>(null);
  const itemInputRef = inputRef ?? internalItemInputRef;
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
  };

  React.useEffect(() => {
    if (!autoFocus) return;
    const timeout = setTimeout(() => itemInputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, [autoFocus, itemInputRef]);

  const notesClassName =
    notesStyle === 'inline'
      ? 'min-h-44 text-start text-lg font-bold text-foreground'
      : 'min-h-24 rounded-md border border-border bg-card px-3 py-2 text-base text-foreground';

  const fields = (
    <View className={compact ? 'gap-1' : 'gap-2'}>
      <MealScheduleSentence
        date={selectedDate}
        onDateChange={setSelectedDate}
        mealTag={mealTag}
        onMealTagChange={setMealTag}
        disabled={!hasItemTitle}
      />
      <BottomSheet.BareTextInput
        key={itemNotesInputKey}
        defaultValue={itemNotesDefaultValue}
        onChangeText={setItemNotes}
        placeholder={notesPlaceholder}
        multiline
        style={{
          textAlignVertical: 'top',
          ...(compact ? { maxHeight: 72 } : {}),
        }}
        scrollEnabled={compact}
        className={
          compact
            ? 'min-h-0 py-0 text-lg leading-6 text-muted-foreground'
            : notesClassName
        }
      />
      {showMetaBar ? (
        <MealPlanMetaBar
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

  return (
    <ItemInput
      compact={compact}
      renderContent={(input, suggestions) =>
        renderContent ? (
          renderContent(
            <>
              {input}
              {fields}
            </>,
            suggestions
          )
        ) : (
          <>
            {suggestions}
            {input}
            {fields}
          </>
        )
      }
      placeholder="Item name"
      inputKey={itemNameInputKey}
      defaultValue={itemNameDefaultValue}
      value={itemName}
      matchingValue={itemName}
      onChangeText={handleItemTextChange}
      onSelect={handleSelectSavedItem}
      showMatchingItems={showMatchingItems}
      setShowMatchingItems={setShowMatchingItems}
      onSubmit={onSubmit}
      inputRef={itemInputRef}
      keepKeyboardOnSubmit={keepKeyboardOnSubmit}
    />
  );
};
