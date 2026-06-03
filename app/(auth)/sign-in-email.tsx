import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
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
import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { useTheme } from '@/hooks/use-theme';
import { getEmailLinkRedirectUrl } from '@/lib/clerk/email-link';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';

type PendingFlow = 'sign-in' | 'sign-up';
type EmailDeliveryStrategy = 'email_code' | 'email_link';
type ClerkError = {
  errors?: {
    code?: string;
    longMessage?: string;
    message?: string;
    meta?: unknown;
  }[];
  status?: number;
};

const getClerkError = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('errors' in error)) {
    return null;
  }

  return (error as ClerkError).errors?.[0] ?? null;
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

export default function SignInEmail() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signOut } = useAuth();
  const { replace } = useRouter();
  const signInToInstant = useInstantSignIn();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const otpRef = useRef<OtpInputRef>(null);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingFlow, setPendingFlow] = useState<PendingFlow | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const isLoaded = isSignInLoaded && isSignUpLoaded;
  const isBusy = isSendingCode || isVerifyingCode || isResendingCode;
  const signInEmailLinkRedirectUrl = getEmailLinkRedirectUrl('sign-in');
  const signUpEmailLinkRedirectUrl = getEmailLinkRedirectUrl('sign-up');

  const normalizeEmail = () => email.trim().toLowerCase();
  const normalizeCode = () => code.replace(/\D/g, '').trim();
  const clearCodeInput = useCallback(() => {
    setCode('');
    otpRef.current?.clear();
  }, []);

  const resetToSignedOutState = async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  };

  const completeAuthentication = async (
    sessionId: string | null,
    options: { shouldCreateDefaultList?: boolean } = {}
  ) => {
    const { shouldCreateDefaultList = false } = options;

    if (!setActive) {
      errorEmailAuth(
        'setActive was unavailable while completing authentication'
      );
      return;
    }

    if (!sessionId) {
      errorEmailAuth('missing session id while completing authentication');
      toast.error('We could not finish signing you in. Please try again.');
      return;
    }

    logEmailAuth('activating Clerk session', {
      hasSessionId: Boolean(sessionId),
    });
    await setActive({ session: sessionId });

    try {
      await signInToInstant();
      if (shouldCreateDefaultList) {
        await initializeDefaultGroceryList();
      }
      replace('/(tabs)');
    } catch (error) {
      errorEmailAuth('Instant sign-in failed after Clerk auth completed', {
        error: getClerkErrorPayload(error),
      });
      await resetToSignedOutState();
      toast.error('We could not finish signing you in. Please try again.');
    }
  };

  const sendSignUpEmailCode = async (
    normalizedEmail: string
  ): Promise<EmailDeliveryStrategy> => {
    if (!signUp) {
      throw new Error('Sign-up is not ready yet.');
    }

    logEmailAuth('starting sign-up email delivery', {
      email: maskEmail(normalizedEmail),
    });

    const signUpAttempt = await signUp.create({
      emailAddress: normalizedEmail,
    });

    logEmailAuth('created sign-up attempt', {
      email: maskEmail(normalizedEmail),
      status: signUpAttempt.status,
    });

    if (signUpAttempt.status === 'complete') {
      await completeAuthentication(signUpAttempt.createdSessionId, {
        shouldCreateDefaultList: true,
      });
      return 'email_code';
    }

    try {
      await signUpAttempt.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      logEmailAuth('sent sign-up email code', {
        email: maskEmail(normalizedEmail),
      });

      setPendingFlow('sign-up');
      clearCodeInput();
      return 'email_code';
    } catch (error) {
      if (!isEmailCodeUnavailableError(error)) {
        throw error;
      }

      warnEmailAuth(
        'email code unavailable for sign-up, falling back to email link',
        {
          email: maskEmail(normalizedEmail),
          error: getClerkErrorPayload(error),
          redirectUrl: signUpEmailLinkRedirectUrl,
        }
      );

      await signUpAttempt.prepareEmailAddressVerification({
        strategy: 'email_link',
        redirectUrl: signUpEmailLinkRedirectUrl,
      });

      logEmailAuth('sent sign-up email link fallback', {
        email: maskEmail(normalizedEmail),
      });

      setPendingFlow(null);
      clearCodeInput();
      return 'email_link';
    }
  };

  const sendSignInEmailCode = async (
    normalizedEmail: string
  ): Promise<EmailDeliveryStrategy> => {
    if (!signIn) {
      throw new Error('Sign-in is not ready yet.');
    }

    const signInAttempt =
      signIn.identifier === normalizedEmail
        ? signIn
        : await signIn.create({ identifier: normalizedEmail });

    const supportedStrategies =
      signInAttempt.supportedFirstFactors?.map(factor => factor.strategy) ?? [];

    logEmailAuth('loaded sign-in attempt factors', {
      email: maskEmail(normalizedEmail),
      identifier: signInAttempt.identifier,
      supportedStrategies,
    });

    const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
      factor => factor.strategy === 'email_code'
    );
    const emailLinkFactor = signInAttempt.supportedFirstFactors?.find(
      factor => factor.strategy === 'email_link'
    );

    if (
      !emailCodeFactor &&
      emailLinkFactor &&
      'emailAddressId' in emailLinkFactor
    ) {
      warnEmailAuth(
        'email code unsupported for sign-in, falling back to email link',
        {
          email: maskEmail(normalizedEmail),
          supportedStrategies,
          redirectUrl: signInEmailLinkRedirectUrl,
        }
      );

      const preparedSignInAttempt = await signInAttempt.prepareFirstFactor({
        strategy: 'email_link',
        emailAddressId: emailLinkFactor.emailAddressId,
        redirectUrl: signInEmailLinkRedirectUrl,
      });

      if (preparedSignInAttempt.status === 'complete') {
        await completeAuthentication(preparedSignInAttempt.createdSessionId);
      }

      setPendingFlow(null);
      clearCodeInput();
      return 'email_link';
    }

    if (!emailCodeFactor || !('emailAddressId' in emailCodeFactor)) {
      throw new Error('Email sign-in is not available for this account.');
    }

    try {
      const preparedSignInAttempt = await signInAttempt.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      logEmailAuth('prepared sign-in first factor', {
        email: maskEmail(normalizedEmail),
        status: preparedSignInAttempt.status,
        strategy: 'email_code',
      });

      if (preparedSignInAttempt.status === 'complete') {
        await completeAuthentication(preparedSignInAttempt.createdSessionId);
        return 'email_code';
      }

      setPendingFlow('sign-in');
      clearCodeInput();
      return 'email_code';
    } catch (error) {
      if (
        !emailLinkFactor ||
        !('emailAddressId' in emailLinkFactor) ||
        !isEmailCodeUnavailableError(error)
      ) {
        throw error;
      }

      warnEmailAuth(
        'failed to prepare email code for sign-in, falling back to email link',
        {
          email: maskEmail(normalizedEmail),
          error: getClerkErrorPayload(error),
          supportedStrategies,
          redirectUrl: signInEmailLinkRedirectUrl,
        }
      );

      const preparedSignInAttempt = await signInAttempt.prepareFirstFactor({
        strategy: 'email_link',
        emailAddressId: emailLinkFactor.emailAddressId,
        redirectUrl: signInEmailLinkRedirectUrl,
      });

      if (preparedSignInAttempt.status === 'complete') {
        await completeAuthentication(preparedSignInAttempt.createdSessionId);
      }

      setPendingFlow(null);
      clearCodeInput();
      return 'email_link';
    }
  };

  const sendEmailCode = async () => {
    if (!isLoaded || !signIn) {
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
      isSignInLoaded,
      isSignUpLoaded,
    });

    try {
      await sendSignInEmailCode(normalizedEmail);
    } catch (err: unknown) {
      const clerkError = getClerkError(err);
      const errorMessage = getErrorMessage(err);

      if (clerkError?.code === 'form_identifier_not_found') {
        warnEmailAuth('email not found during sign-in, starting sign-up flow', {
          email: maskEmail(normalizedEmail),
        });

        try {
          await sendSignUpEmailCode(normalizedEmail);
        } catch (signUpError) {
          errorEmailAuth('sign-up email delivery failed', {
            email: maskEmail(normalizedEmail),
            error: getClerkErrorPayload(signUpError),
          });
          toast.error(
            getErrorMessage(signUpError) ?? 'Failed to send verification code'
          );
        }
      } else if (clerkError?.code === 'form_param_format_invalid') {
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
        toast.error(errorMessage ?? 'Failed to send verification code');
      }
    }
  };

  const verifyEmailCode = async () => {
    if (!isLoaded || !pendingFlow || !signIn || !signUp) {
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
      if (pendingFlow === 'sign-up') {
        const signUpAttempt = await signUp.attemptEmailAddressVerification({
          code: normalizedCode,
        });

        logEmailAuth('received sign-up code verification result', {
          status: signUpAttempt.status,
        });

        if (signUpAttempt.status === 'complete') {
          await completeAuthentication(signUpAttempt.createdSessionId, {
            shouldCreateDefaultList: true,
          });
          return;
        }
      } else {
        const signInAttempt = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code: normalizedCode,
        });

        logEmailAuth('received sign-in code verification result', {
          status: signInAttempt.status,
        });

        if (signInAttempt.status === 'complete') {
          await completeAuthentication(signInAttempt.createdSessionId);
          return;
        }
      }

      toast.error(
        'We could not finish signing you in. Please request a new code.'
      );
    } catch (err: unknown) {
      errorEmailAuth('email code verification failed', {
        pendingFlow,
        email: maskEmail(normalizeEmail()),
        error: getClerkErrorPayload(err),
      });
      toast.error(getErrorMessage(err) ?? 'Failed to verify code');
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
    if (!isLoaded || !pendingFlow || !signIn || !signUp) {
      return;
    }

    const normalizedEmail = normalizeEmail();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsResendingCode(true);

    try {
      if (pendingFlow === 'sign-up') {
        if (signUp.emailAddress !== normalizedEmail) {
          await sendSignUpEmailCode(normalizedEmail);
        } else {
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          });
          setPendingFlow('sign-up');
        }
      } else {
        await sendSignInEmailCode(normalizedEmail);
      }

      clearCodeInput();
    } catch (err: unknown) {
      errorEmailAuth('resending email code failed', {
        pendingFlow,
        email: maskEmail(normalizedEmail),
        error: getClerkErrorPayload(err),
      });
      toast.error(getErrorMessage(err) ?? 'Failed to resend verification code');
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
          {!pendingFlow ? (
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
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
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
