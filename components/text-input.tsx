import { XIcon } from 'lucide-react-native';
import { forwardRef, useCallback, useRef, useState } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

import { cn } from '../lib/utils';

import { Button } from './ui/button';
import { Icon } from './ui/icon';

const bareTextInputClassName =
  'min-h-8 border-none bg-transparent text-xl font-medium leading-7 text-foreground';

export type OpaqueTextInputProps = TextInputProps & {
  /**
   * Shows a clear button when the field has a value.
   * Defaults to true for opaque inputs.
   */
  clearable?: boolean;
  /**
   * Icon-sized (size-8) accessory rendered inside the trailing edge of the
   * field, after the clear button.
   */
  trailingAccessory?: React.ReactNode;
};

/** Right padding needed to keep text clear of N trailing size-8 accessories. */
const trailingPaddingByCount = ['', 'pr-11', 'pr-20'] as const;

export const TextDisplayInput = forwardRef<RNTextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        className={cn(bareTextInputClassName, className)}
        {...props}
      />
    );
  }
);

export const BareTextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        className={cn(bareTextInputClassName, className)}
        {...props}
      />
    );
  }
);

export const TextInput = forwardRef<RNTextInput, OpaqueTextInputProps>(
  (
    {
      className,
      clearable = true,
      onChangeText,
      value,
      defaultValue,
      editable,
      trailingAccessory,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<RNTextInput>(null);
    const isControlled = value !== undefined;
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
      () => String(defaultValue ?? '').length > 0
    );
    const hasValue = isControlled
      ? String(value).length > 0
      : uncontrolledHasValue;
    const showClear = clearable && hasValue && editable !== false;
    const trailingCount = Number(showClear) + Number(!!trailingAccessory);

    const setRefs = useCallback(
      (node: RNTextInput | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const handleChangeText = (text: string) => {
      if (!isControlled) {
        setUncontrolledHasValue(text.length > 0);
      }
      onChangeText?.(text);
    };

    const handleClear = () => {
      if (!isControlled) {
        setUncontrolledHasValue(false);
        // Fabric ignores setNativeProps({ text: '' }); use clear() instead.
        inputRef.current?.clear();
      }
      onChangeText?.('');
      inputRef.current?.focus();
    };

    return (
      <View className="relative self-stretch">
        <RNTextInput
          ref={setRefs}
          className={cn(
            'h-11 rounded-full bg-input px-4 text-base leading-5 text-foreground',
            trailingPaddingByCount[trailingCount],
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onChangeText={handleChangeText}
          editable={editable}
          {...props}
        />
        {trailingCount > 0 ? (
          <View className="absolute bottom-0 right-1.5 top-0 flex-row items-center">
            {showClear ? (
              <Button
                variant="ghost"
                size="icon"
                onPress={handleClear}
                className="h-8 w-8"
                accessibilityLabel="Clear text"
              >
                <Icon as={XIcon} size={18} className="text-muted-foreground" />
              </Button>
            ) : null}
            {trailingAccessory}
          </View>
        ) : null}
      </View>
    );
  }
);

BareTextInput.displayName = 'BareTextInput';
TextDisplayInput.displayName = 'TextDisplayInput';
TextInput.displayName = 'TextInput';
