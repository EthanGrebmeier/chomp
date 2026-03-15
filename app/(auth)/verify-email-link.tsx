import { useAuth, useClerk, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import {
  EMAIL_LINK_FLOW_PARAM,
  EMAIL_LINK_COMPLETE_ROUTE,
  EMAIL_LINK_CONTINUE_ROUTE,
} from '@/lib/clerk/email-link';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';

type VerificationState =
  | 'verifying'
  | 'finishing'
  | 'expired'
  | 'failed'
  | 'client-mismatch'
  | 'other-device';

const getFailureState = (error: unknown): Exclude<
  VerificationState,
  'verifying' | 'finishing'
> => {
  const clerkError =
    error && typeof error === 'object' && 'errors' in error
      ? (error as {
          errors?: { code?: string; message?: string; longMessage?: string }[];
        }).errors?.[0]
      : null;

  const details = [
    clerkError?.code,
    clerkError?.message,
    clerkError?.longMessage,
    error instanceof Error ? error.message : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    details.includes('client_mismatch') ||
    details.includes('same device') ||
    details.includes('same client')
  ) {
    return 'client-mismatch';
  }

  if (details.includes('other device')) {
    return 'other-device';
  }

  if (details.includes('expired')) {
    return 'expired';
  }

  return 'failed';
};

const logVerification = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[verify-email-link] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[verify-email-link] ${message}`, payload);
};

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getEmailLinkFlow = (
  params: Record<string, string | string[] | undefined>
) => {
  const flow = getParamValue(params[EMAIL_LINK_FLOW_PARAM]);
  return flow === 'sign-up' || flow === 'sign-in' ? flow : null;
};

const getFailureStateFromParams = (
  params: Record<string, string | string[] | undefined>
): Exclude<VerificationState, 'verifying' | 'finishing'> | null => {
  const status = getParamValue(params.__clerk_status)?.toLowerCase();

  if (status === 'client_mismatch') {
    return 'client-mismatch';
  }

  if (status === 'expired') {
    return 'expired';
  }

  if (status === 'failed') {
    return 'failed';
  }

  if (getParamValue(params.client_mismatch) === 'true') {
    return 'client-mismatch';
  }

  if (getParamValue(params.expired) === 'true') {
    return 'expired';
  }

  if (getParamValue(params.failed) === 'true') {
    return 'failed';
  }

  return null;
};

export default function VerifyEmailLink() {
  const { handleEmailLinkVerification } = useClerk();
  const { isLoaded: isSignInLoaded } = useSignIn();
  const { isLoaded: isSignUpLoaded } = useSignUp();
  const { signOut } = useAuth();
  const signInToInstant = useInstantSignIn();
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasAttemptedVerification = useRef(false);
  const hasResolvedVerification = useRef(false);
  const [verificationState, setVerificationState] =
    useState<VerificationState>('verifying');

  const isLoaded = isSignInLoaded && isSignUpLoaded;
  const failureStateFromParams = getFailureStateFromParams(params);
  const emailLinkFlow = getEmailLinkFlow(params);

  useEffect(() => {
    logVerification('screen mounted with params', params);
  }, [params]);

  useEffect(() => {
    logVerification('clerk load state changed', {
      isLoaded,
      isSignInLoaded,
      isSignUpLoaded,
    });
  }, [isLoaded, isSignInLoaded, isSignUpLoaded]);

  useEffect(() => {
    logVerification('verification state changed', verificationState);
  }, [verificationState]);

  useEffect(() => {
    if (verificationState !== 'verifying') {
      return;
    }

    const timeout = setTimeout(() => {
      logVerification('still verifying after 10 seconds', {
        hasAttemptedVerification: hasAttemptedVerification.current,
        hasResolvedVerification: hasResolvedVerification.current,
        params,
      });
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [params, verificationState]);

  useEffect(() => {
    if (!isLoaded || hasAttemptedVerification.current) {
      logVerification('verification effect skipped', {
        isLoaded,
        hasAttemptedVerification: hasAttemptedVerification.current,
        failureStateFromParams,
      });
      return;
    }

    if (failureStateFromParams) {
      hasAttemptedVerification.current = true;
      logVerification('verification failed from Clerk URL params', {
        failureStateFromParams,
        params,
      });
      setVerificationState(failureStateFromParams);
      return;
    }

    hasAttemptedVerification.current = true;
    let isCancelled = false;

    const verifyEmailLink = async () => {
      try {
        logVerification('starting Clerk email link verification');

        const navigateAfterVerification = async (to: string) => {
          logVerification('Clerk requested navigation', { to, isCancelled });

          if (isCancelled) {
            return;
          }

          hasResolvedVerification.current = true;

          if (
            to === EMAIL_LINK_COMPLETE_ROUTE ||
            to.startsWith(`${EMAIL_LINK_COMPLETE_ROUTE}?`)
          ) {
            setVerificationState('finishing');
            logVerification('starting Instant sign-in after successful verification');

            try {
              await signInToInstant();
              if (emailLinkFlow === 'sign-up') {
                await initializeDefaultGroceryList();
              }
              logVerification('Instant sign-in completed successfully');
            } catch {
              // eslint-disable-next-line no-console
              console.error(
                '[verify-email-link] Instant sign-in failed after email verification'
              );
              try {
                await signOut();
              } catch {
                // Best effort: keep auth layers aligned when Instant sign-in fails.
              }

              if (!isCancelled) {
                setVerificationState('failed');
              }

              return;
            }
          }

          if (!isCancelled) {
            logVerification('navigating after verification', to);
            router.replace(to as Href);
          }
        };

        await handleEmailLinkVerification(
          {
            redirectUrl: EMAIL_LINK_CONTINUE_ROUTE,
            redirectUrlComplete: EMAIL_LINK_COMPLETE_ROUTE,
            onVerifiedOnOtherDevice: () => {
              hasResolvedVerification.current = true;
              logVerification('verification completed on another device');
              if (!isCancelled) {
                setVerificationState('other-device');
              }
            },
          },
          navigateAfterVerification
        );

        logVerification('handleEmailLinkVerification resolved', {
          isCancelled,
          hasResolvedVerification: hasResolvedVerification.current,
        });

        if (isCancelled || hasResolvedVerification.current) {
          return;
        }

        setVerificationState('failed');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[verify-email-link] Clerk email link verification failed', error);
        if (!isCancelled) {
          setVerificationState(getFailureState(error));
        }
      }
    };

    void verifyEmailLink();

    return () => {
      isCancelled = true;
    };
  }, [
    failureStateFromParams,
    handleEmailLinkVerification,
    isLoaded,
    params,
    router,
    emailLinkFlow,
    signInToInstant,
    signOut,
  ]);

  if (verificationState === 'verifying' || verificationState === 'finishing') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <ActivityIndicator size="large" />
          <Text variant="h1" className="text-3xl">
            {verificationState === 'verifying'
              ? 'Verifying Link'
              : 'Signing You In'}
          </Text>
          <Text variant="muted" className="text-center">
            {verificationState === 'verifying'
              ? 'Hold on while we verify your sign-in link.'
              : 'Finishing your sign-in and syncing your account.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const content = {
    expired: {
      title: 'Link Expired',
      body: 'Your sign-in link has expired. Request a new one to continue.',
    },
    failed: {
      title: 'Verification Failed',
      body: 'We could not verify that sign-in link. Try requesting a new one.',
    },
    'client-mismatch': {
      title: 'Use the Same Device',
      body: 'Open the sign-in link on the same device where you requested it.',
    },
    'other-device': {
      title: 'Link Opened Elsewhere',
      body: 'That sign-in link was completed on another device. Return to sign in here if needed.',
    },
  }[verificationState];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="gap-8">
          <View className="gap-3">
            <Text variant="h1">{content.title}</Text>
            <Text variant="muted" className="text-center">
              {content.body}
            </Text>
          </View>

          <View className="gap-4">
            <Button size="lg" onPress={() => router.replace('/(auth)/sign-in-email')}>
              <Text>Back to Email Sign In</Text>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text>Back to Sign-In Options</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
