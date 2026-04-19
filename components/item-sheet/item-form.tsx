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
        value={itemInputValue}
        onChangeText={onChangeItemText}
        onSelect={onSelect}
        showMatchingItems={showMatchingItems}
        setShowMatchingItems={setShowMatchingItems}
        onSubmit={handleSubmitEditing}
        inputRef={itemInputRef}
        disableAutocomplete={disableAutocomplete}
      />
      {recipe && <RecipeTag />}
      <NotesInput />
    </>
  );
};
