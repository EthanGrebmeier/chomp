import { cn } from '@/lib/utils';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { ComponentProps, forwardRef } from 'react';
import { View } from 'react-native';
import { THEME } from '../lib/theme';
import { Text } from './ui/text';

type BottomSheetProps = {
  children: React.ReactNode;
  ref: React.RefObject<BottomSheetModal | null>;
  onOpen?: () => void;
  onStartClose?: () => void;
  viewClassName?: string;
  ignoreSafeArea?: boolean;
  snapPoints?: string[];
};

export const BottomSheet = ({
  children,
  ref,
  onStartClose,
  onOpen,
  viewClassName,
  ignoreSafeArea = false,
  snapPoints,
}: BottomSheetProps) => {
  const colorscheme = useColorScheme();

  return (
    <BottomSheetModal
      keyboardBlurBehavior="restore"
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
      onAnimate={(fromIndex, toIndex) => {
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
      snapPoints={snapPoints}
    >
      <BottomSheetView
        className={cn('px-4', !ignoreSafeArea && 'pb-safe', viewClassName)}
      >
        {children}
      </BottomSheetView>
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
        'h-10 rounded-md border border-input bg-input px-3 text-foreground shadow-sm shadow-black/5',
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
