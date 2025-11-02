import { ReactNode, forwardRef, useCallback, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';
import { cn } from '../lib/utils';
import { TextDisplayInput } from './text-input';

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
    const [localValue, setLocalValue] = useState(value);
    const hasClearedName = useRef(false);
    const previousText = useRef(value);

    const debouncedOnChangeText = useDebounceCallback(onChangeText, 500);

    const handleFocus = (textInputRef: TextInput | null) => {
      if (autofocus && textInputRef) {
        textInputRef.focus();
      }
    };

    const refFunction = useCallback(
      (textInputRef: TextInput | null) => {
        handleFocus(textInputRef);
        if (ref && 'current' in ref) {
          ref.current = textInputRef;
        }
      },
      [handleFocus, ref]
    );

    const handleChangeText = (text: string) => {
      setLocalValue(text);
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
        setLocalValue('');
        debouncedOnChangeText('');
        hasClearedName.current = true;
        previousText.current = '';
      } else {
        previousText.current = text;
      }
    };

    const handleKeyPress = (e: any) => {
      if (
        e.nativeEvent.key === 'Backspace' &&
        autofocus &&
        clearOnBackspace &&
        !hasClearedName.current
      ) {
        // If backspace is pressed and we're in autofocus mode with default name, clear the entire title
        setLocalValue('');
        debouncedOnChangeText('');
        hasClearedName.current = true;
      }
      onKeyPress?.(e);
    };

    return (
      <View className={cn('shrink px-4', className)}>
        <TextDisplayInput
          ref={refFunction}
          onChangeText={handleChangeText}
          value={localValue}
          multiline={multiline}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
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
