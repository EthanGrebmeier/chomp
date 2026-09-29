import { ReactNode } from 'react';

import { ItemInput } from './item-input';
import { NotesInput } from './notes-input';
import { useItemSheet } from './use-item-sheet';

type ItemFormProps = {
  /**
   * Rendered between the name and notes inputs; the Edit sheet uses it to
   * show where the item came from (recipe or meal plan link).
   */
  source?: ReactNode;
};

export const ItemForm = ({ source }: ItemFormProps) => {
  const {
    itemInputValue,
    itemInputKey,
    itemInputDefaultValue,
    itemInputRef,
    showMatchingItems,
    setShowMatchingItems,
    onChangeItemText,
    onSelect,
    onSubmit,
    disableAutocomplete,
    mode,
  } = useItemSheet();

  // In the Edit sheet (live updates, no footer button) the return key on the
  // name input should dismiss the keyboard rather than fire a submit. The
  // debounced text write in useLiveItemSync already persists the value. The
  // Add sheet keeps its existing submit-on-return behavior.
  const handleSubmitEditing =
    mode === 'update' ? () => itemInputRef.current?.blur() : onSubmit;

  return (
    <>
      <ItemInput
        placeholder="Add Item"
        inputKey={itemInputKey}
        defaultValue={itemInputDefaultValue}
        matchingValue={itemInputValue}
        onChangeText={onChangeItemText}
        onSelect={onSelect}
        showMatchingItems={showMatchingItems}
        setShowMatchingItems={setShowMatchingItems}
        onSubmit={handleSubmitEditing}
        inputRef={itemInputRef}
        disableAutocomplete={disableAutocomplete}
        keepKeyboardOnSubmit={mode === 'add'}
      />
      {source}
      <NotesInput />
    </>
  );
};
