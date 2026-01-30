import { ItemInput } from './item-input';
import { NotesInput } from './notes-input';
import { RecipeTag } from './recipe-tag';
import { useItemSheet } from './use-item-sheet';

export const ItemForm = () => {
  const {
    recipe,
    itemInputValue,
    itemInputRef,
    showMatchingItems,
    setShowMatchingItems,
    onChangeItemText,
    onSelect,
    onSubmit,
    disableAutocomplete,
  } = useItemSheet();

  return (
    <>
      <ItemInput
        placeholder="Add Item"
        value={itemInputValue}
        onChangeText={onChangeItemText}
        onSelect={onSelect}
        showMatchingItems={showMatchingItems}
        setShowMatchingItems={setShowMatchingItems}
        onSubmit={onSubmit}
        inputRef={itemInputRef}
        disableAutocomplete={disableAutocomplete}
      />
      {recipe && <RecipeTag />}
      <NotesInput />
    </>
  );
};
