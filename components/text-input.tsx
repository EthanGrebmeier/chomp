import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';

import { cn } from '../lib/utils';

export const TextDisplayInput = forwardRef<RNTextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        className={cn('text-foreground', className)}
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

TextDisplayInput.displayName = 'TextDisplayInput';
TextInput.displayName = 'TextInput';
