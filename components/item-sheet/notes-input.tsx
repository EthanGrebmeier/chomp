import { ItemNotesField } from './item-fields';
import { useItemSheet } from './use-item-sheet';

export const NotesInput = () => {
  const {
    notesInputKey,
    notesInputDefaultValue,
    notesInputRef,
    onChangeNotesText,
  } = useItemSheet();

  return (
    <ItemNotesField
      key={notesInputKey}
      ref={notesInputRef}
      defaultValue={notesInputDefaultValue}
      onChangeText={onChangeNotesText}
    />
  );
};
