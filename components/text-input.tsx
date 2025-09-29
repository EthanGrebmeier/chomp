import { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

export const TextDisplayInput = forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    return <TextInput ref={ref} {...props} />;
  }
);
