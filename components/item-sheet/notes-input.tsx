import { BottomSheet } from '../bottom-sheet';

import { useItemSheet } from './use-item-sheet';

export const NotesInput = () => {
  const { notesInputValue, onChangeNotesText } = useItemSheet();

  return (
    <BottomSheet.BareTextInput
      value={notesInputValue}
      onChangeText={onChangeNotesText}
      placeholder="Notes"
      multiline
      style={{ textAlignVertical: 'top' }}
      className="min-h-36 flex-1 text-start text-lg font-medium text-muted-foreground"
    />
  );
};
