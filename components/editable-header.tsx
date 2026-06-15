import { ReactNode, forwardRef, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';

import { cn } from '../lib/utils';

import { TextDisplayInput } from './text-input';
import { useUncontrolledTextInput } from './use-uncontrolled-text-input';

export type EditableHeaderProps = {
  /** The current name value */
  value: string;
  /** Callback when the name changes */
  onChangeText: (text: string) => void;
  /** Whether to auto-focus the input when mounted */
  autofocus?: boolean;
  /** Custom content to display below the title */
  children?: ReactNode;
  /** Custom className for the title input */
  titleClassName?: string;
  /** Custom className for the container */
  className?: string;
  /** Whether the input is multiline */
  multiline?: boolean;
  /** Callback when the input is focused */
  onFocus?: () => void;
  /** Callback when the input is blurred */
  onBlur?: () => void;
  /** Callback when a key is pressed */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onKeyPress?: (e: any) => void;
  /** Whether to clear the entire text when backspace is pressed in autofocus mode */
  clearOnBackspace?: boolean;
};

export const EditableHeader = forwardRef<TextInput, EditableHeaderProps>(
  (
    {
      value,
      onChangeText,
      autofocus = false,
      children,
      titleClassName,
      className,
      multiline = true,
      onFocus,
      onBlur,
      onKeyPress,
      clearOnBackspace = true,
    },
    ref
  ) => {
    const titleInput = useUncontrolledTextInput(value);
    const hasClearedName = useRef(false);
    const previousText = useRef(value);

    const debouncedOnChangeText = useDebounceCallback(onChangeText, 500);

    const handleChangeText = (text: string) => {
      titleInput.handleChangeText(text);
      debouncedOnChangeText(text);

      // Handle backspace clearing in autofocus mode
      if (
        autofocus &&
        clearOnBackspace &&
        !hasClearedName.current &&
        previousText.current.length > text.length &&
        text.length === 0
      ) {
        // If backspace was pressed and we're in autofocus mode, clear the entire title
        titleInput.reset();
        debouncedOnChangeText('');
        hasClearedName.current = true;
        previousText.current = '';
      } else {
        previousText.current = text;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyPress = (e: any) => {
      if (
        e.nativeEvent.key === 'Backspace' &&
        autofocus &&
        clearOnBackspace &&
        !hasClearedName.current
      ) {
        // If backspace is pressed and we're in autofocus mode with default name, clear the entire title
        titleInput.reset();
        debouncedOnChangeText('');
        hasClearedName.current = true;
      }
      onKeyPress?.(e);
    };

    return (
      <View className={cn('shrink px-4', className)}>
        <TextDisplayInput
          key={titleInput.inputKey}
          ref={ref}
          onChangeText={handleChangeText}
          defaultValue={titleInput.defaultValue}
          multiline={multiline}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
          numberOfLines={2}
          className={cn(
            'align-text-top text-3xl font-bold leading-[0.9]',
            titleClassName
          )}
        />
        {children}
      </View>
    );
  }
);

EditableHeader.displayName = 'EditableHeader';
