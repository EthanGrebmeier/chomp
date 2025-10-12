import { cn } from '@/lib/utils';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, forwardRef } from 'react';
import { THEME } from '../lib/theme';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  onOpen?: () => void;
  onStartClose?: () => void;
};

export const BottomSheet = ({
  children,
  ref,
  onStartClose,
  onClose,
  onOpen,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  return (
    <BottomSheetModal
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          style={{
            backgroundColor: THEME.dark.background,
          }}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      ref={ref}
      onAnimate={(fromIndex, toIndex, position) => {
        if (fromIndex === -1) {
          onOpen?.();
        }
        if (toIndex === -1) {
          onStartClose?.();
        }
      }}
      backgroundStyle={{
        backgroundColor:
          colorscheme.colorScheme === 'dark'
            ? THEME.dark.card
            : THEME.light.card,
      }}
      handleIndicatorStyle={{
        backgroundColor:
          colorscheme.colorScheme === 'dark'
            ? THEME.dark.cardForeground
            : THEME.light.cardForeground,
      }}
    >
      <BottomSheetView className="pb-safe px-4">{children}</BottomSheetView>
    </BottomSheetModal>
  );
};

type BottomSheetTextInputProps = ComponentProps<typeof BottomSheetTextInput>;

const TextInput = forwardRef<
  React.ComponentRef<typeof BottomSheetTextInput>,
  BottomSheetTextInputProps
>(({ className, ...props }, ref) => {
  return (
    <BottomSheetTextInput
      className={cn(
        'h-10 rounded-md border border-input bg-input px-3 py-2 text-foreground shadow-sm shadow-black/5',
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

const BareTextInput = forwardRef<
  React.ComponentRef<typeof BottomSheetTextInput>,
  BottomSheetTextInputProps
>(({ className, ...props }, ref) => {
  return (
    <BottomSheetTextInput
      {...props}
      ref={ref}
      className={cn('border-none bg-transparent', className)}
    />
  );
});

BottomSheet.BareTextInput = BareTextInput;

BottomSheet.TextInput = TextInput;
