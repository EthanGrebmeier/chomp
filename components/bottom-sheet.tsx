import {
  InsetAdjustment,
  SheetDetent,
  TrueSheet,
} from '@lodev09/react-native-true-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, ReactElement, forwardRef } from 'react';
import { TextInput as RNTextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  detents?: SheetDetent[];
  footer?: ReactElement;
  insetAdjustment?: InsetAdjustment;
};

export const BottomSheet = ({
  children,
  ref,
  name,
  onStartClose,
  onOpen,
  viewClassName,
  footer,
  detents,
  insetAdjustment,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  const { bottom } = useSafeAreaInsets();

  return (
    <TrueSheet
      ref={ref}
      name={name}
      detents={detents ?? ['auto']}
      onDidPresent={onOpen}
      onDidDismiss={onStartClose}
      backgroundColor={
        colorscheme.colorScheme === 'dark' ? THEME.dark.card : THEME.light.card
      }
      grabber
      dimmedDetentIndex={0}
      pageSizing
      footer={footer}
      insetAdjustment={insetAdjustment}
    >
      <View
        className={cn('px-4', viewClassName)}
        style={{ paddingTop: bottom }}
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
  dismissButton,
  button,
}: {
  title: string;
  dismissButton?: React.ReactNode;
  button?: React.ReactNode;
}) => {
  return (
    <View className="flex-1 flex-row justify-between">
      <View className="flex-row items-center gap-2">
        {dismissButton}
        <Text className="text-2xl font-bold leading-tight">{title}</Text>
      </View>
      {button}
    </View>
  );
};

const Subtext = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Text className={cn('text-base text-muted-foreground', className)}>
      {children}
    </Text>
  );
};

BottomSheet.Header = Header;
BottomSheet.Subtext = Subtext;
BottomSheet.BareTextInput = BareTextInput;

BottomSheet.TextInput = TextInput;
