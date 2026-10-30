import {
  InsetAdjustment,
  SheetDetent,
  TrueSheet,
} from '@lodev09/react-native-true-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, ReactElement, forwardRef, useState } from 'react';
import { View } from 'react-native';

import {
  BareTextInput,
  TextInput as OpaqueTextInput,
} from '@/components/text-input';
import { cn } from '@/lib/utils';

import { THEME } from '../lib/theme';

import {
  SheetBody,
  SheetContentRoot,
  SheetHasFooterContext,
  SHEET_TOP_STYLE,
} from './sheet-content';
import { SheetExitContext } from './sheet-exit-context';
import { SheetHeader } from './sheet-header';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<TrueSheet | null>;
  name?: string;
  onOpen?: () => void;
  /** Focus inputs during presentation so the keyboard transitions with the sheet. */
  onStartOpen?: () => void;
  /** Restore input focus as a sheet above this one begins to dismiss. */
  onFocus?: () => void;
  draggable?: boolean;
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
  onStartOpen,
  onFocus,
  draggable,
  viewClassName,
  footer,
  detents,
  insetAdjustment,
  scrollable,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();
  const [footerHeight, setFooterHeight] = useState(0);

  return (
    <TrueSheet
      ref={ref}
      name={name}
      detents={detents ?? ['auto']}
      onDidPresent={onOpen}
      onWillPresent={onStartOpen}
      onWillFocus={onFocus}
      draggable={draggable}
      onWillDismiss={onStartClose}
      onDidDismiss={onDismiss}
      backgroundColor={
        colorscheme.colorScheme === 'dark'
          ? THEME.dark.background
          : THEME.light.background
      }
      grabber
      dimmedDetentIndex={0}
      footer={
        footer ? (
          <View
            onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
          >
            {footer}
          </View>
        ) : undefined
      }
      insetAdjustment={insetAdjustment ?? 'never'}
      scrollable={scrollable}
    >
      <SheetExitContext.Provider
        value={() => {
          void ref.current?.dismiss();
        }}
      >
        <SheetContentRoot>
          <SheetHasFooterContext.Provider value={Boolean(footer)}>
            <View
              className={cn(viewClassName)}
              style={[
                SHEET_TOP_STYLE,
                { paddingBottom: footer ? footerHeight : 0 },
              ]}
            >
              {children}
            </View>
          </SheetHasFooterContext.Provider>
        </SheetContentRoot>
      </SheetExitContext.Provider>
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
BottomSheet.Header = SheetHeader;
BottomSheet.BareTextInput = BareTextInput;
BottomSheet.TextInput = TextInput;
BottomSheet.SheetView = SheetBody;
