import { useEffect } from 'react';
import { ActivityIndicator, Platform } from 'react-native';

import { AppleIcon } from '@/assets/icons/apple';
import { GoogleIcon } from '@/assets/icons/google';
import { useOAuthFlow } from '@/lib/clerk/use-oauth';

import { Button } from '../ui/button';
import { Text } from '../ui/text';

interface SocialButtonsProps {
  disabled?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function SocialButtons({
  disabled = false,
  onLoadingChange,
}: SocialButtonsProps) {
  const { signInWithGoogle, signInWithApple, isLoadingGoogle, isLoadingApple } =
    useOAuthFlow();

  const isAnyLoading = isLoadingGoogle || isLoadingApple;
  const isDisabled = disabled || isAnyLoading;

  useEffect(() => {
    onLoadingChange?.(isAnyLoading);
  }, [isAnyLoading, onLoadingChange]);

  return (
    <>
      {Platform.OS === 'ios' && (
        <Button
          className="w-full"
          variant="secondary"
          size="xl"
          icon={
            <AppleIcon
              className="-translate-x-1  text-secondary-foreground"
              width={24}
              height={24}
            />
          }
          onPress={signInWithApple}
          disabled={isDisabled}
        >
          {isLoadingApple ? (
            <ActivityIndicator />
          ) : (
            <Text>Sign in with Apple</Text>
          )}
        </Button>
      )}

      <Button
        className="w-full"
        variant="secondary"
        size="xl"
        icon={
          <GoogleIcon
            className=" text-secondary-foreground"
            width={14}
            height={14}
          />
        }
        onPress={signInWithGoogle}
        disabled={isDisabled}
      >
        {isLoadingGoogle ? (
          <ActivityIndicator />
        ) : (
          <Text>Sign in with Google</Text>
        )}
      </Button>
    </>
  );
}
