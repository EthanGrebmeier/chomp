import { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from '../lib/utils';

export const TextDisplayInput = forwardRef<TextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn('text-foreground', className)}
        {...props}
      />
    );
  }
);
