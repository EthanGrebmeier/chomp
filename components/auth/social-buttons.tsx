import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { Platform, View, useColorScheme } from 'react-native';

import { useOAuthFlow } from '@/lib/clerk/use-oauth';

import { Button } from '../ui/button';
import { Text } from '../ui/text';

interface SocialButtonsProps {
  disabled?: boolean;
  type: 'sign-in' | 'sign-up';
}

export function SocialButtons({
  disabled = false,
  type = 'sign-in',
}: SocialButtonsProps) {
  const buttonType =
    type === 'sign-in'
      ? AppleAuthenticationButtonType.SIGN_IN
      : AppleAuthenticationButtonType.SIGN_UP;
  const isDark = useColorScheme() === 'dark';
  const { signInWithGoogle, signInWithApple, isLoadingGoogle, isLoadingApple } =
    useOAuthFlow();

  const isAnyLoading = isLoadingGoogle || isLoadingApple;
  const isDisabled = disabled || isAnyLoading;

  return (
    <View className="mt-4 flex-col items-center justify-center gap-2">
      {Platform.OS === 'ios' && (
        <AppleAuthenticationButton
          buttonType={buttonType}
          buttonStyle={
            isDark
              ? AppleAuthenticationButtonStyle.WHITE
              : AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={99}
          onPress={signInWithApple}
          style={{ height: 40, width: 252 }}
        />
      )}

      <Button className="h-10 w-[252]" variant="secondary">
        <Text className="text-sm font-semibold">Sign in with Google</Text>
      </Button>
    </View>
  );
}
