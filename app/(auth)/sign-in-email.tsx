import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { OtpInput, OtpInputRef } from 'react-native-otp-entry';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { BareTextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { useTheme } from '@/hooks/use-theme';
import { getEmailLinkRedirectUrl } from '@/lib/clerk/email-link';
import { InstantBridgeError, useInstantSignIn } from '@/lib/instant/use-clerk-auth';

type PendingFlow = 'sign-in';
type EmailDeliveryStrategy = 'email_code' | 'email_link';
type ClerkErrorDetail = {
  code?: string;
  longMessage?: string;
  message?: string;
  meta?: unknown;
};
type ClerkError = {
  code?: string;
  errors?: ClerkErrorDetail[];
  longMessage?: string;
  message?: string;
  status?: number;
};

const getClerkError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const clerkError = error as ClerkError;
  if (clerkError.errors?.[0]) {
    return clerkError.errors[0];
  }

  if (clerkError.code || clerkError.message || clerkError.longMessage) {
    return {
      code: clerkError.code,
      longMessage: clerkError.longMessage,
      message: clerkError.message,
    };
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  const clerkError = getClerkError(error);
  if (clerkError?.longMessage) {
    return clerkError.longMessage;
  }

  if (clerkError?.message) {
    return clerkError.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
};

const maskEmail = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  const [localPart, domainPart] = normalizedValue.split('@');

  if (!localPart || !domainPart) {
    return normalizedValue;
  }

  const visibleLocalPart = localPart.slice(0, 2);
  return `${visibleLocalPart}***@${domainPart}`;
};

const getClerkErrorPayload = (error: unknown) => {
  const clerkError = getClerkError(error);

  return {
    message: getErrorMessage(error),
    code: clerkError?.code,
    longMessage: clerkError?.longMessage,
    meta: clerkError?.meta,
    status:
      error && typeof error === 'object' && 'status' in error
        ? (error as ClerkError).status
        : undefined,
  };
};

const logEmailAuth = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[sign-in-email] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[sign-in-email] ${message}`, payload);
};

const warnEmailAuth = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[sign-in-email] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(`[sign-in-email] ${message}`, payload);
};

const errorEmailAuth = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.error(`[sign-in-email] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`[sign-in-email] ${message}`, payload);
};

const isEmailCodeUnavailableError = (error: unknown) => {
  const clerkError = getClerkError(error);
  const details = [
    clerkError?.code,
    clerkError?.message,
    clerkError?.longMessage,
    error instanceof Error ? error.message : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    details.includes('email_code') ||
    details.includes('email code') ||
    details.includes('first factor') ||
    details.includes('strategy')
  );
};

const throwIfFutureError = (error: unknown | null | undefined) => {
  if (error) {
    throw error;
  }
};

export default function SignInEmail() {
  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInFetchStatus,
  } = useSignIn();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();
  const { signOut } = useAuth();
  const { push, replace } = useRouter();
  const signInToInstant = useInstantSignIn();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const otpRef = useRef<OtpInputRef>(null);
  const emailInput = useUncontrolledTextInput();

  const [code, setCode] = useState('');
  const [pendingFlow, setPendingFlow] = useState<PendingFlow | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isFinishingSignIn, setIsFinishingSignIn] = useState(false);
  const [bridgeRetry, setBridgeRetry] = useState<{
    shouldCreateDefaultList: boolean;
  } | null>(null);
  const isLoaded =
    signInFetchStatus === 'idle' && signUpFetchStatus === 'idle';
  const isBusy =
    signInFetchStatus === 'fetching' ||
    signUpFetchStatus === 'fetching' ||
    isSendingCode ||
    isVerifyingCode ||
    isResendingCode ||
    isFinishingSignIn;
  const signInEmailLinkRedirectUrl = getEmailLinkRedirectUrl('sign-in');

  const normalizeEmail = () => emailInput.getValue().trim().toLowerCase();
  const normalizeCode = () => code.replace(/\D/g, '').trim();
  const clearCodeInput = useCallback(() => {
    setCode('');
    otpRef.current?.clear();
  }, []);
  const getLatestSignInErrorMessage = () =>
    signInErrors.fields.identifier?.message ??
    signInErrors.fields.code?.message ??
    signInErrors.global?.[0]?.longMessage ??
    signInErrors.global?.[0]?.message ??
    null;
  const getLatestSignUpErrorMessage = () =>
    signUpErrors.fields.emailAddress?.message ??
    signUpErrors.fields.code?.message ??
    signUpErrors.fields.captcha?.message ??
    signUpErrors.global?.[0]?.longMessage ??
    signUpErrors.global?.[0]?.message ??
    null;

  const resetToSignedOutState = async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  };

  const finishInstantSignIn = async (shouldCreateDefaultList: boolean) => {
    setIsFinishingSignIn(true);

    try {
      await signInToInstant();
      if (shouldCreateDefaultList) {
        await initializeDefaultGroceryList();
      }
      setBridgeRetry(null);
      replace('/(tabs)');
    } catch (error) {
      // Clerk auth already succeeded. A transient Instant bridge timeout should
      // not tear down the Clerk session — keep it and let the user retry the
      // bridge without re-entering their email or code.
      if (error instanceof InstantBridgeError) {
        errorEmailAuth('Instant bridge timed out after Clerk auth completed', {
          isTimeout: error.isTimeout,
          error: getClerkErrorPayload(error.cause),
        });
        setBridgeRetry({ shouldCreateDefaultList });
        toast.error(
          'Network issue finishing sign-in. Check your connection and tap Retry.'
        );
        return;
      }

      errorEmailAuth('Instant sign-in failed after Clerk auth completed', {
        error: getClerkErrorPayload(error),
      });
      await resetToSignedOutState();
      toast.error('We could not finish signing you in. Please try again.');
    } finally {
      setIsFinishingSignIn(false);
    }
  };

  const completeAuthentication = async (options: {
    finalize: () => Promise<{ error: unknown | null }>;
    shouldCreateDefaultList?: boolean;
  }) => {
    const { finalize, shouldCreateDefaultList = false } = options;

    logEmailAuth('finalizing Clerk authentication', {
      shouldCreateDefaultList,
    });

    const { error } = await finalize();
    throwIfFutureError(error);

    await finishInstantSignIn(shouldCreateDefaultList);
  };

  const onRetryFinishPress = async () => {
    if (!bridgeRetry) {
      return;
    }

    await finishInstantSignIn(bridgeRetry.shouldCreateDefaultList);
  };

  const sendSignInEmailCode = async (
    normalizedEmail: string
  ): Promise<EmailDeliveryStrategy> => {
    if (signIn.identifier && signIn.identifier !== normalizedEmail) {
      const { error: resetSignInError } = await signIn.reset();
      throwIfFutureError(resetSignInError);

      const { error: resetSignUpError } = await signUp.reset();
      throwIfFutureError(resetSignUpError);
    }

    logEmailAuth('starting sign-in-or-up email delivery', {
      email: maskEmail(normalizedEmail),
    });

    const { error: createError } = await signIn.create({
      identifier: normalizedEmail,
      signUpIfMissing: true,
    });
    throwIfFutureError(createError);

    const supportedStrategies =
      signIn.supportedFirstFactors?.map(factor => factor.strategy) ?? [];

    logEmailAuth('created sign-in-or-up attempt', {
      email: maskEmail(normalizedEmail),
      identifier: signIn.identifier,
      status: signIn.status,
      supportedStrategies,
    });

    const { error: sendCodeError } = await signIn.emailCode.sendCode();
    if (!sendCodeError) {
      logEmailAuth('sent sign-in-or-up email code', {
        email: maskEmail(normalizedEmail),
      });

      setPendingFlow('sign-in');
      clearCodeInput();
      return 'email_code';
    }

    if (!isEmailCodeUnavailableError(sendCodeError)) {
      throw sendCodeError;
    }

    warnEmailAuth('email code unavailable, falling back to sign-in email link', {
      email: maskEmail(normalizedEmail),
      error: getClerkErrorPayload(sendCodeError),
      supportedStrategies,
      redirectUrl: signInEmailLinkRedirectUrl,
    });

    const { error: linkError } = await signIn.emailLink.sendLink({
      verificationUrl: signInEmailLinkRedirectUrl,
    });
    throwIfFutureError(linkError);

    if (signIn.status === 'complete') {
      await completeAuthentication({
        finalize: () => signIn.finalize(),
      });
    }

    setPendingFlow(null);
    clearCodeInput();
    return 'email_link';
  };

  const sendEmailCode = async () => {
    if (!isLoaded) {
      return;
    }

    const normalizedEmail = normalizeEmail();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    logEmailAuth('user requested email authentication', {
      email: maskEmail(normalizedEmail),
      isLoaded,
      signInFetchStatus,
      signUpFetchStatus,
    });

    try {
      await sendSignInEmailCode(normalizedEmail);
    } catch (err: unknown) {
      const clerkError = getClerkError(err);
      const errorMessage = getErrorMessage(err);

      if (clerkError?.code === 'form_param_format_invalid') {
        toast.error('Please enter a valid email address');
      } else if (clerkError?.code === 'strategy_for_user_invalid') {
        toast.error(
          'This account uses a different sign-in method. Try Apple or Google instead.'
        );
      } else {
        errorEmailAuth('email delivery failed', {
          email: maskEmail(normalizedEmail),
          error: getClerkErrorPayload(err),
        });
        toast.error(
          errorMessage ??
            getLatestSignInErrorMessage() ??
            'Failed to send verification code'
        );
      }
    }
  };

  const transferVerifiedSignInToSignUp = async () => {
    const { error } = await signUp.create({ transfer: true });
    throwIfFutureError(error);

    logEmailAuth('transferred verified sign-in to sign-up', {
      status: signUp.status,
      missingFields: signUp.missingFields,
    });

    if (signUp.status === 'complete') {
      await completeAuthentication({
        finalize: () => signUp.finalize(),
        shouldCreateDefaultList: true,
      });
      return;
    }

    if (signUp.status === 'missing_requirements') {
      push('/(auth)/continue');
      return;
    }

    errorEmailAuth('unexpected sign-up status after transfer', {
      status: signUp.status,
      missingFields: signUp.missingFields,
    });
    toast.error(
      getLatestSignUpErrorMessage() ??
        'We could not finish creating your account. Please try again.'
    );
  };

  const verifyEmailCode = async () => {
    if (!isLoaded || !pendingFlow) {
      return;
    }

    const normalizedCode = normalizeCode();

    if (!normalizedCode) {
      toast.error('Please enter the verification code');
      return;
    }

    logEmailAuth('verifying email code', {
      pendingFlow,
      codeLength: normalizedCode.length,
      email: maskEmail(normalizeEmail()),
    });

    try {
      const { error } = await signIn.emailCode.verifyCode({
        code: normalizedCode,
      });

      if (error) {
        if (getClerkError(error)?.code === 'sign_up_if_missing_transfer') {
          await transferVerifiedSignInToSignUp();
          return;
        }

        errorEmailAuth('email code verification returned an error', {
          pendingFlow,
          email: maskEmail(normalizeEmail()),
          error: getClerkErrorPayload(error),
        });
        toast.error(
          getErrorMessage(error) ??
            getLatestSignInErrorMessage() ??
            'Failed to verify code'
        );
        return;
      }

      logEmailAuth('received sign-in code verification result', {
        status: signIn.status,
      });

      if (signIn.status === 'complete') {
        await completeAuthentication({
          finalize: () => signIn.finalize(),
        });
        return;
      }

      if (
        signIn.status === 'needs_second_factor' ||
        signIn.status === 'needs_client_trust'
      ) {
        toast.error('Additional verification is required. Please try again.');
        return;
      }

      errorEmailAuth('unexpected sign-in status after code verification', {
        status: signIn.status,
      });
      toast.error(
        'We could not finish signing you in. Please request a new code.'
      );
    } catch (err: unknown) {
      errorEmailAuth('email code verification failed', {
        pendingFlow,
        email: maskEmail(normalizeEmail()),
        error: getClerkErrorPayload(err),
      });
      toast.error(
        getErrorMessage(err) ??
          getLatestSignInErrorMessage() ??
          getLatestSignUpErrorMessage() ??
          'Failed to verify code'
      );
    }
  };

  const onSendCodePress = async () => {
    setIsSendingCode(true);
    try {
      await sendEmailCode();
    } catch {
      toast.error('Failed to send verification code');
      setIsSendingCode(false);
      return;
    }

    setIsSendingCode(false);
  };

  const onVerifyCodePress = async () => {
    setIsVerifyingCode(true);
    try {
      await verifyEmailCode();
    } catch {
      setIsVerifyingCode(false);
      return;
    }

    setIsVerifyingCode(false);
  };

  const onResendCode = async () => {
    if (!isLoaded || !pendingFlow) {
      return;
    }

    const normalizedEmail = normalizeEmail();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsResendingCode(true);

    try {
      await sendSignInEmailCode(normalizedEmail);
      clearCodeInput();
    } catch (err: unknown) {
      errorEmailAuth('resending email code failed', {
        pendingFlow,
        email: maskEmail(normalizedEmail),
        error: getClerkErrorPayload(err),
      });
      toast.error(
        getErrorMessage(err) ??
          getLatestSignInErrorMessage() ??
          'Failed to resend verification code'
      );
      setIsResendingCode(false);
      return;
    }

    setIsResendingCode(false);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2">
        <BackButton />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        className="flex-1"
      >
        <View
          className="flex-1 justify-between px-4 pt-8"
          style={{ paddingBottom: bottom + 16 }}
        >
          {bridgeRetry ? (
            <>
              <View className="w-full gap-6">
                <View className="w-full items-start justify-start gap-2">
                  <Text variant="h1">Almost there</Text>
                  <View>
                    <Text variant="muted">
                      We verified your email but couldn&apos;t finish connecting.
                      Check your internet connection and try again.
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-full items-center">
                <Button
                  className="w-full"
                  onPress={onRetryFinishPress}
                  disabled={isFinishingSignIn}
                  size="lg"
                >
                  {isFinishingSignIn ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Retry</Text>
                  )}
                </Button>
              </View>
            </>
          ) : !pendingFlow ? (
            <>
              <View className="w-full gap-6">
                <View className="w-full items-start justify-start gap-2">
                  <Text variant="h1">Sign In with Email</Text>
                  <View>
                    <Text variant="muted">
                      Enter your email and we&apos;ll send you a verification
                      code
                    </Text>
                  </View>
                </View>

                <View className="gap-4">
                  <BareTextInput
                    key={emailInput.inputKey}
                    placeholder="Email"
                    defaultValue={emailInput.defaultValue}
                    onChangeText={emailInput.handleChangeText}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!isBusy}
                    className="text-xl"
                  />
                </View>
              </View>

              <View className="w-full items-center">
                <Button
                  className="w-full"
                  onPress={onSendCodePress}
                  disabled={isBusy}
                  size="lg"
                >
                  {isSendingCode ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Send Code</Text>
                  )}
                </Button>
              </View>
            </>
          ) : (
            <>
              <View className="w-full gap-6">
                <View className="w-full items-start justify-start gap-2">
                  <Text variant="h1">Enter Code</Text>
                  <View>
                    <Text variant="muted">
                      We sent a verification code to {normalizeEmail()}.
                    </Text>
                    <Text variant="muted">
                      Enter the 6-digit code to continue.
                    </Text>
                  </View>
                </View>

                <View className="gap-4">
                  <View className="items-center">
                    <OtpInput
                      ref={otpRef}
                      numberOfDigits={6}
                      onTextChange={setCode}
                      onFilled={setCode}
                      blurOnFilled
                      disabled={isBusy}
                      type="numeric"
                      textInputProps={{
                        accessibilityLabel: 'Email verification code input',
                        autoCorrect: false,
                        autoComplete: 'one-time-code',
                        contextMenuHidden: false,
                        keyboardType: 'number-pad',
                        selectTextOnFocus: true,
                        textContentType: 'oneTimeCode',
                      }}
                      theme={{
                        containerStyle: {
                          width: 'auto',
                          gap: 8,
                        },
                        pinCodeContainerStyle: {
                          width: 44,
                          height: 56,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: theme.input,
                          backgroundColor: theme.input,
                        },
                        pinCodeTextStyle: {
                          fontSize: 24,
                          fontWeight: '600',
                          color: theme.foreground,
                        },
                        focusedPinCodeContainerStyle: {
                          borderColor: theme.primary,
                        },
                        filledPinCodeContainerStyle: {
                          borderColor: theme.primary,
                        },
                        focusStickStyle: {
                          backgroundColor: theme.primary,
                        },
                      }}
                    />
                  </View>
                </View>
              </View>

              <View className="items-center gap-2">
                <Button
                  onPress={onVerifyCodePress}
                  disabled={isBusy}
                  size="xl"
                  className="w-full"
                >
                  {isVerifyingCode ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Verify Code</Text>
                  )}
                </Button>

                <Button
                  onPress={onResendCode}
                  disabled={isBusy}
                  size="xl"
                  variant="outline"
                  className="w-full"
                >
                  {isResendingCode ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Resend Code</Text>
                  )}
                </Button>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
