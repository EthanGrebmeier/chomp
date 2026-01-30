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
  scrollable?: boolean;
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
  scrollable,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  const { bottom } = useSafeAreaInsets();

  return (
    <TrueSheet
      ref={ref}
      name={name}
      detents={detents ?? ['auto']}
      onWillPresent={onOpen}
      onDidDismiss={onStartClose}
      backgroundColor={
        colorscheme.colorScheme === 'dark' ? THEME.dark.card : THEME.light.card
      }
      grabber
      dimmedDetentIndex={0}
      pageSizing
      footer={footer}
      insetAdjustment={insetAdjustment}
      scrollable={scrollable}
    >
      <View className={cn(viewClassName)} style={{ paddingTop: bottom }}>
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
        'h-12 rounded-md border border-border bg-input px-3 leading-4 text-foreground shadow-sm shadow-black/5',
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

type HeaderProps = {
  title: string;
  subsection?: React.ReactNode;
  dismissButton?: React.ReactNode;
  button?: React.ReactNode;
  className?: string;
};

const Header = ({
  title,
  subsection,
  dismissButton,
  button,
  className,
}: HeaderProps) => {
  return (
    <View className="mb-6">
      <View className={cn('mb-6 flex-row items-center', className)}>
        {(dismissButton ?? button) && (
          <View className="w-12 items-start">{dismissButton}</View>
        )}
        <View className="mx-2 flex-1">
          <Text
            className="text-center text-2xl font-bold leading-tight"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        {(dismissButton ?? button) && (
          <View className="w-12 items-end">{button}</View>
        )}
      </View>
      {subsection && (
        <View className="mt-2 text-center text-sm text-muted-foreground">
          {subsection}
        </View>
      )}
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
    <Text
      className={cn('text-center text-base text-muted-foreground', className)}
    >
      {children}
    </Text>
  );
};

const SheetView = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <View className={cn('px-4', className)}>{children}</View>;
};

BottomSheet.Header = Header;
BottomSheet.Subtext = Subtext;
BottomSheet.BareTextInput = BareTextInput;
BottomSheet.TextInput = TextInput;
BottomSheet.SheetView = SheetView;
