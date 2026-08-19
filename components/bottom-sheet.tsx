import {
  InsetAdjustment,
  SheetDetent,
  TrueSheet,
} from '@lodev09/react-native-true-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, ReactElement, forwardRef } from 'react';
import { View } from 'react-native';

import {
  BareTextInput,
  TextInput as OpaqueTextInput,
} from '@/components/text-input';
import { cn } from '@/lib/utils';

import { THEME } from '../lib/theme';

import { Text } from './ui/text';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<TrueSheet | null>;
  name?: string;
  onOpen?: () => void;
  /**
   * Fires when the sheet has started closing (swipe, tap-outside, or
   * programmatic dismiss) but before its dismiss animation has finished.
   * Use this when you need to run logic against the still-current form
   * state, e.g. flushing a pending live-write debounce.
   */
  onStartClose?: () => void;
  /**
   * Fires after the sheet has fully dismissed. Use this for post-close
   * cleanup such as resetting form state or clearing refs.
   */
  onDismiss?: () => void;
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
  onDismiss,
  onOpen,
  viewClassName,
  footer,
  detents,
  insetAdjustment,
  scrollable,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  return (
    <TrueSheet
      ref={ref}
      name={name}
      detents={detents ?? ['auto']}
      onDidPresent={onOpen}
      onWillDismiss={onStartClose}
      onDidDismiss={onDismiss}
      backgroundColor={
        colorscheme.colorScheme === 'dark'
          ? THEME.dark.background
          : THEME.light.background
      }
      grabber
      dimmedDetentIndex={0}
      footer={footer}
      insetAdjustment={insetAdjustment}
      scrollable={scrollable}
    >
      <View className={cn(viewClassName)} style={{ paddingTop: 24 }}>
        {children}
      </View>
    </TrueSheet>
  );
};

type BottomSheetTextInputProps = ComponentProps<typeof OpaqueTextInput>;

const TextInput = forwardRef<
  React.ComponentRef<typeof OpaqueTextInput>,
  BottomSheetTextInputProps
>(({ className, ...props }, ref) => {
  return (
    <OpaqueTextInput
      className={cn(
        'h-12 rounded-md bg-muted px-3 text-base leading-5 text-foreground shadow-sm shadow-black/5',
        className
      )}
      {...props}
      ref={ref}
    />
  );
});
TextInput.displayName = 'TextInput';
type HeaderProps = {
  title?: string;
  description?: React.ReactNode;
  dismissButton?: React.ReactNode;
  button?: React.ReactNode;
  className?: string;
};

const Header = ({
  title,
  description,
  dismissButton,
  button,
  className,
}: HeaderProps) => {
  return (
    <View className={cn('mb-4 gap-2', className)}>
      <View className="flex-row items-center">
        {(dismissButton ?? button) && (
          <View className="w-12 items-start">{dismissButton}</View>
        )}
        <View className="mx-2 flex-1">
          {title && (
            <Text
              variant="h3"
              className="text-center"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          )}
        </View>
        {(dismissButton ?? button) && (
          <View className="w-12 items-end">{button}</View>
        )}
      </View>
      {description ? (
        <Text variant="bodyMuted" className="text-center">
          {description}
        </Text>
      ) : null}
    </View>
  );
};

const SheetView = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <View className={cn('px-6', className)}>{children}</View>;
};

BottomSheet.Header = Header;
BottomSheet.BareTextInput = BareTextInput;
BottomSheet.TextInput = TextInput;
BottomSheet.SheetView = SheetView;
