import { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

import { BottomSheet } from '../bottom-sheet';

/** Presentation-only fields shared by the live item form and isolated previews. */
export const ItemNameField = forwardRef<TextInput, TextInputProps>(
  (props, ref) => (
    <BottomSheet.BareTextInput
      ref={ref}
      className="text-2xl font-bold text-foreground"
      placeholder="Add Item"
      autoCorrect={false}
      autoCapitalize="words"
      submitBehavior="blurAndSubmit"
      {...props}
    />
  )
);
ItemNameField.displayName = 'ItemNameField';

export const ItemNotesField = forwardRef<TextInput, TextInputProps>(
  (props, ref) => (
    <BottomSheet.BareTextInput
      ref={ref}
      placeholder="Notes"
      multiline
      scrollEnabled={false}
      style={{ textAlignVertical: 'top' }}
      className="text-start text-lg font-medium text-muted-foreground"
      {...props}
    />
  )
);
ItemNotesField.displayName = 'ItemNotesField';
