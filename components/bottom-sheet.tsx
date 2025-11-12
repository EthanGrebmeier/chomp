import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, forwardRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { cn } from '@/lib/utils';

import { THEME } from '../lib/theme';

import { Text } from './ui/text';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<TrueSheet | null>;
  name?: string;
  onOpen?: () => void;
  onStartClose?: () => void;
  viewClassName?: string;
  ignoreSafeArea?: boolean;
  snapPoints?: string[];
};

export const BottomSheet = ({
  children,
  ref,
  name,
  onStartClose,
  onOpen,
  viewClassName,
  ignoreSafeArea = false,
  snapPoints,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  return (
    <TrueSheet
      ref={ref}
      name={name}
      sizes={['auto']}
      onPresent={onOpen}
      onDismiss={onStartClose}
      backgroundColor={
        colorscheme.colorScheme === 'dark' ? THEME.dark.card : THEME.light.card
      }
      grabberProps={{
        style: {
          backgroundColor:
            colorscheme.colorScheme === 'dark'
              ? THEME.dark.cardForeground
              : THEME.light.cardForeground,
        },
      }}
      cornerRadius={16}
      dimmedIndex={0}
    >
      <View
        className={cn('px-4 pt-6', !ignoreSafeArea && 'pb-safe', viewClassName)}
      >
        {children}
      </View>
    </TrueSheet>
  );
};

type BottomSheetTextInputProps = ComponentProps<typeof RNTextInput>;

const TextInput = forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  BottomSheetTextInputProps
>(({ className, ...props }, ref) => {
  return (
    <RNTextInput
      className={cn(
        'h-10 rounded-md border border-input bg-input px-3 text-foreground shadow-sm shadow-black/5',
        className
      )}
      {...props}
      ref={ref}
    />
  );
});
TextInput.displayName = 'TextInput';
const BareTextInput = forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  BottomSheetTextInputProps
>(({ className, ...props }, ref) => {
  return (
    <RNTextInput
      {...props}
      ref={ref}
      className={cn('border-none bg-transparent', className)}
    />
  );
});
BareTextInput.displayName = 'BareTextInput';
const Header = ({
  title,
  button,
}: {
  title: string;
  button?: React.ReactNode;
}) => {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-2xl font-bold">{title}</Text>
      {button}
    </View>
  );
};

BottomSheet.Header = Header;
BottomSheet.BareTextInput = BareTextInput;

BottomSheet.TextInput = TextInput;
