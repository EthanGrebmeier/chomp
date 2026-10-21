import { ItemNotesField } from './item-fields';
import { useItemSheet } from './use-item-sheet';

export const NotesInput = ({ compact = false }: { compact?: boolean }) => {
  const {
    notesInputKey,
    notesInputDefaultValue,
    notesInputRef,
    onChangeNotesText,
  } = useItemSheet();

  return (
    <ItemNotesField
      {...(compact
        ? {
            className: 'min-h-0 py-0 text-lg leading-6 text-muted-foreground',
            placeholder: 'Note',
            style: { maxHeight: 72, textAlignVertical: 'top' as const },
            scrollEnabled: true,
          }
        : {})}
      key={notesInputKey}
      ref={notesInputRef}
      defaultValue={notesInputDefaultValue}
      onChangeText={onChangeNotesText}
    />
  );
};
