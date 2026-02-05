import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useColorScheme } from 'nativewind';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { OtpInput, OtpInputRef } from 'react-native-otp-entry';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { CloseButton } from '../../../components/ui/close-button';
import { THEME } from '../../../lib/theme';
import { useJoinGroceryListByCode } from '../instant/useJoinGroceryListByCode';

export type JoinByCodeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type JoinByCodeSheetProps = {
  onJoined: (listId: string) => void;
};

const CODE_LENGTH = 8;

export const JoinByCodeSheet = forwardRef<
  JoinByCodeSheetRef,
  JoinByCodeSheetProps
>(({ onJoined }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const otpRef = useRef<OtpInputRef>(null);
  const lastSubmittedCodeRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { colorScheme } = useColorScheme();

  const theme = useMemo(
    () => (colorScheme === 'dark' ? THEME.dark : THEME.light),
    [colorScheme]
  );

  const joinGroceryListByCode = useJoinGroceryListByCode();

  const resetCode = useCallback(() => {
    otpRef.current?.clear();
    lastSubmittedCodeRef.current = null;
  }, []);

  const handleDismiss = () => {
    KeyboardController.dismiss();
    resetCode();
    sheetRef.current?.dismiss();
  };

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
      setTimeout(() => {
        otpRef.current?.focus();
      }, 100);
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleJoinByCode = useCallback(
    async (joinCode: string) => {
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await joinGroceryListByCode.mutateAsync(joinCode);
        if (result.success) {
          toast.success(`Joined "${result.listName}"`);
          resetCode();
          sheetRef.current?.dismiss();
          onJoined(result.listId);
        } else {
          toast.error(result.error);
          // Clear and refocus on error so user can try again
          resetCode();
          otpRef.current?.focus();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, joinGroceryListByCode, onJoined, resetCode]
  );

  const tryJoinByCode = useCallback(
    (value: string) => {
      const joinCode = value.trim();
      if (joinCode.length !== CODE_LENGTH) {
        return;
      }
      if (lastSubmittedCodeRef.current === joinCode) {
        return;
      }
      lastSubmittedCodeRef.current = joinCode;
      void handleJoinByCode(joinCode);
    },
    [handleJoinByCode]
  );

  return (
    <BottomSheet
      name="join-by-code-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        resetCode();
      }}
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header
          title="Join by Code"
          button={<CloseButton onPress={handleDismiss} />}
          subsection={
            <BottomSheet.Subtext className="text-center text-sm text-muted-foreground">
              Enter the 8-character, case-sensitive code
            </BottomSheet.Subtext>
          }
        />

        <View className="mt-6 items-center justify-center gap-6">
          {isLoading ? (
            <View className="h-12 items-center justify-center">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <OtpInput
              ref={otpRef}
              numberOfDigits={CODE_LENGTH}
              onTextChange={tryJoinByCode}
              onFilled={tryJoinByCode}
              autoFocus={false}
              hideStick={false}
              type="alphanumeric"
              textInputProps={{
                accessibilityLabel: 'Join code input',
                autoCapitalize: 'none',
                autoCorrect: false,
                contextMenuHidden: false,
                selectTextOnFocus: true,
              }}
              theme={{
                containerStyle: {
                  gap: 8,
                },
                pinCodeContainerStyle: {
                  width: 36,
                  height: 48,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.input,
                  backgroundColor: theme.input,
                },
                pinCodeTextStyle: {
                  fontSize: 20,
                  fontFamily: 'monospace',
                  color: theme.foreground,
                },
                focusedPinCodeContainerStyle: {
                  borderColor: theme.primary,
                },
                focusStickStyle: {
                  backgroundColor: theme.primary,
                },
              }}
            />
          )}
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

JoinByCodeSheet.displayName = 'JoinByCodeSheet';
