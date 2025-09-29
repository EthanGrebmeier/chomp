import { cn } from '@/lib/utils';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { ComponentProps, forwardRef } from 'react';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  onOpen?: () => void;
};

export const BottomSheet = ({
  children,
  ref,
  onClose,
  onOpen,
}: BottomSheetProps) => {
  return (
    <BottomSheetModal
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      ref={ref}
      onChange={index => {
        if (index === -1) {
          onClose();
        } else if (index >= 0 && onOpen) {
          onOpen();
        }
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
        'h-10 rounded-md border border-input px-3 py-2 shadow-sm shadow-black/5 ',
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

BottomSheet.TextInput = TextInput;
