import { cn } from '@/lib/utils';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { TextInputProps } from 'react-native';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
};

export const BottomSheet = ({ children, ref, onClose }: BottomSheetProps) => {
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
        }
      }}
    >
      <BottomSheetView className="pb-safe px-4">{children}</BottomSheetView>
    </BottomSheetModal>
  );
};

const TextInput = ({ className, ...props }: TextInputProps) => {
  return (
    <BottomSheetTextInput
      className={cn(
        'border-input h-10 rounded-md border px-3 py-2 shadow-sm shadow-black/5 ',
        className
      )}
      {...props}
    />
  );
};

BottomSheet.TextInput = TextInput;
