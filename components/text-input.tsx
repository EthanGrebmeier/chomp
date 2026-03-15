import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';

import { cn } from '../lib/utils';

const bareTextInputClassName =
  'min-h-8 border-none bg-transparent text-xl leading-8 text-foreground font-medium';

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

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        className={cn(
          'h-11 rounded-full bg-input px-4 leading-none text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);

BareTextInput.displayName = 'BareTextInput';
TextDisplayInput.displayName = 'TextDisplayInput';
TextInput.displayName = 'TextInput';
