import { useEffect } from 'react';
import { ActivityIndicator, Platform } from 'react-native';

import { AppleIcon } from '@/assets/icons/apple';
import { GoogleIcon } from '@/assets/icons/google';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { useOAuthFlow } from '@/lib/clerk/use-oauth';

import { type ButtonProps } from '../ui/button';
import { Text } from '../ui/text';

interface SocialButtonsProps {
  disabled?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  variant?: ButtonProps['variant'];
}

export function SocialButtons({
  disabled = false,
  onLoadingChange,
  variant = 'secondary',
}: SocialButtonsProps) {
  const { signInWithGoogle, signInWithApple, isLoadingGoogle, isLoadingApple } =
    useOAuthFlow();

  const isAnyLoading = isLoadingGoogle || isLoadingApple;
  const isDisabled = disabled || isAnyLoading;

  const iconColorClass =
    variant === 'default'
      ? 'text-primary-foreground'
      : 'text-secondary-foreground';

  useEffect(() => {
    onLoadingChange?.(isAnyLoading);
  }, [isAnyLoading, onLoadingChange]);

  return (
    <>
      {Platform.OS === 'ios' && (
        <BottomActionButton
          className="w-full"
          variant={variant}
          icon={
            <AppleIcon
              className={`-translate-x-1 ${iconColorClass}`}
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
        </BottomActionButton>
      )}

      <BottomActionButton
        className="w-full"
        variant={variant}
        icon={<GoogleIcon className={iconColorClass} width={14} height={14} />}
        onPress={signInWithGoogle}
        disabled={isDisabled}
      >
        {isLoadingGoogle ? (
          <ActivityIndicator />
        ) : (
          <Text>Sign in with Google</Text>
        )}
      </BottomActionButton>
    </>
  );
}
