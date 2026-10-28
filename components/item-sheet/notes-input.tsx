import { ItemNotesField } from './item-fields';
import { useItemSheet } from './use-item-sheet';

export const NotesInput = ({ compact = false }: { compact?: boolean }) => {
  const { notesInputKey, notesInputValue, notesInputRef, onChangeNotesText } =
    useItemSheet();

  return (
    <ItemNotesField
      {...(compact
        ? {
            className: 'min-h-0 py-0 text-lg leading-6 text-muted-foreground',
            placeholder: 'Note',
          }
        : {})}
      key={notesInputKey}
      ref={notesInputRef}
      value={notesInputValue}
      onChangeText={onChangeNotesText}
    />
  );
};
