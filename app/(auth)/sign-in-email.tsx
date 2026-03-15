import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { BareTextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getEmailLinkRedirectUrl } from '@/lib/clerk/email-link';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';

export default function SignInEmail() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signOut } = useAuth();
  const router = useRouter();
  const signInToInstant = useInstantSignIn();
  const { bottom } = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [pendingFlow, setPendingFlow] = useState<'sign-in' | 'sign-up' | null>(
    null
  );
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isResendingLink, setIsResendingLink] = useState(false);
  const isLoaded = isSignInLoaded && isSignUpLoaded;
  const isBusy = isSendingLink || isResendingLink;
  const emailLinkRedirectUrl = getEmailLinkRedirectUrl();

  const normalizeEmail = () => email.trim().toLowerCase();

  const resetToSignedOutState = async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  };

  const completeAuthentication = async (sessionId: string | null) => {
    if (!setActive) {
      return;
    }

    if (!sessionId) {
      toast.error('We could not finish signing you in. Please try again.');
      return;
    }

    await setActive({ session: sessionId });

    try {
      await signInToInstant();
      router.replace('/(tabs)');
    } catch {
      await resetToSignedOutState();
      toast.error('We could not finish signing you in. Please try again.');
    }
  };

  const sendSignUpEmailLink = async (normalizedEmail: string) => {
    if (!signUp) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[sign-in-email] sending sign-up email link', {
      emailLinkRedirectUrl,
      normalizedEmail,
    });

    const signUpAttempt = await signUp.create({
      emailAddress: normalizedEmail,
    });

    if (signUpAttempt.status === 'complete') {
      await completeAuthentication(signUpAttempt.createdSessionId);
      return;
    }

    await signUpAttempt.prepareVerification({
      strategy: 'email_link',
      redirectUrl: emailLinkRedirectUrl,
    });

    setPendingFlow('sign-up');
  };

  const sendSignInEmailLink = async (normalizedEmail: string) => {
    if (!signIn) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[sign-in-email] sending sign-in email link', {
      emailLinkRedirectUrl,
      normalizedEmail,
    });

    const signInAttempt =
      signIn.identifier === normalizedEmail
        ? signIn
        : await signIn.create({ identifier: normalizedEmail });

    const emailLinkFactor = signInAttempt.supportedFirstFactors?.find(
      (factor) => factor.strategy === 'email_link'
    );

    if (!emailLinkFactor || !('emailAddressId' in emailLinkFactor)) {
      throw new Error('Email link sign-in is not available for this account.');
    }

    const preparedSignInAttempt = await signInAttempt.prepareFirstFactor({
      strategy: 'email_link',
      emailAddressId: emailLinkFactor.emailAddressId,
      redirectUrl: emailLinkRedirectUrl,
    });

    if (preparedSignInAttempt.status === 'complete') {
      await completeAuthentication(preparedSignInAttempt.createdSessionId);
      return;
    }

    setPendingFlow('sign-in');
  };

  const sendEmailLink = async () => {
    if (!isLoaded || !signIn) {
      return;
    }

    const normalizedEmail = normalizeEmail();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    try {
      await sendSignInEmailLink(normalizedEmail);
      toast.success('Sign-in link sent to your email');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkError = err as {
          errors: { code: string; message: string }[];
        };
        const error = clerkError.errors?.[0];

        if (error?.code === 'form_identifier_not_found') {
          await sendSignUpEmailLink(normalizedEmail);
          toast.success('Sign-in link sent to your email');
        } else if (error?.code === 'invalid_url_scheme') {
          toast.error(
            'Email-link redirect is misconfigured. Clerk requires an http or https URL.'
          );
        } else if (error?.code === 'form_param_format_invalid') {
          toast.error('Please enter a valid email address');
        } else if (error?.code === 'strategy_for_user_invalid') {
          toast.error(
            'This account uses a different sign-in method. Try Apple or Google instead.'
          );
        } else {
          toast.error(error?.message ?? 'Failed to send sign-in link');
        }
      } else {
        toast.error('Failed to send sign-in link');
      }
    }
  };

  const onSendLinkPress = async () => {
    setIsSendingLink(true);
    try {
      await sendEmailLink();
    } catch {
      toast.error('Failed to send sign-in link');
    }
    setIsSendingLink(false);
  };

  const onResendLink = async () => {
    if (!isLoaded || !pendingFlow || !signIn || !signUp) {
      return;
    }

    const normalizedEmail = normalizeEmail();

    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsResendingLink(true);

    try {
      if (pendingFlow === 'sign-up') {
        if (signUp.emailAddress !== normalizedEmail) {
          await sendSignUpEmailLink(normalizedEmail);
        } else {
          // eslint-disable-next-line no-console
          console.log('[sign-in-email] resending sign-up email link', {
            emailLinkRedirectUrl,
            normalizedEmail,
          });
          await signUp.prepareVerification({
            strategy: 'email_link',
            redirectUrl: emailLinkRedirectUrl,
          });
          setPendingFlow('sign-up');
        }
      } else {
        await sendSignInEmailLink(normalizedEmail);
      }

      toast.success('Sign-in link resent');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkError = err as {
          errors: { code: string; message: string }[];
        };
        toast.error(
          clerkError.errors?.[0]?.message ?? 'Failed to resend sign-in link'
        );
      } else {
        toast.error('Failed to resend sign-in link');
      }
    }

    setIsResendingLink(false);
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
                      Enter your email and we&apos;ll send you a sign-in link
                    </Text>
                  </View>
                </View>

                <View className="gap-4">
                  <BareTextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoFocus
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
                  onPress={onSendLinkPress}
                  disabled={isBusy}
                  size="lg"
                >
                  {isSendingLink ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Send Sign-In Link</Text>
                  )}
                </Button>
              </View>
            </>
          ) : (
            <>
              <View className="w-full items-start justify-start gap-2">
                <Text variant="h1">Check Your Email</Text>
                <View>
                  <Text variant="muted">
                    We sent a sign-in link to {normalizeEmail()}.
                  </Text>
                  <Text variant="muted">
                    Open it on this device to continue.
                  </Text>
                </View>
              </View>

              <View className="items-center gap-4">
                <Button onPress={onResendLink} disabled={isBusy} size="xl">
                  {isResendingLink ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Resend Sign-In Link</Text>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="xl"
                  className="w-full"
                  onPress={() => setPendingFlow(null)}
                  disabled={isBusy}
                >
                  <Text>Use a Different Email</Text>
                </Button>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
