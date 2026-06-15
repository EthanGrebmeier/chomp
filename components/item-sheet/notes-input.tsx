import { BottomSheet } from '../bottom-sheet';

import { useItemSheet } from './use-item-sheet';

export const NotesInput = () => {
  const {
    notesInputKey,
    notesInputDefaultValue,
    notesInputRef,
    onChangeNotesText,
  } = useItemSheet();

  return (
    <BottomSheet.BareTextInput
      key={notesInputKey}
      ref={notesInputRef}
      defaultValue={notesInputDefaultValue}
      onChangeText={onChangeNotesText}
      placeholder="Notes"
      multiline
      style={{ textAlignVertical: 'top' }}
      className="min-h-40  text-start text-lg font-medium text-muted-foreground"
    />
  );
};
