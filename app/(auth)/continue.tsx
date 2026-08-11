import { useAuth, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { LegalLink } from '@/components/auth/legal-consent';
import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import {
  getClerkErrorPayload,
  getSafeClerkErrorMessage,
  isClerkMissingSessionError,
} from '@/lib/clerk/auth-errors';
import {
  InstantBridgeError,
  runWithEmailAuthCompletion,
  useInstantSignIn,
} from '@/lib/instant/use-clerk-auth';

const SIGN_UP_UPDATE_FIELDS: Record<string, string> = {
  email_address: 'emailAddress',
  first_name: 'firstName',
  last_name: 'lastName',
  legal_accepted: 'legalAccepted',
  phone_number: 'phoneNumber',
};

const formatFieldLabel = (field: string) =>
  field.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

const getSignUpUpdateField = (field: string) =>
  SIGN_UP_UPDATE_FIELDS[field] ?? field;

const throwIfFutureError = (error: unknown | null | undefined) => {
  if (error) {
    throw error;
  }
};

type MissingFieldInputProps = {
  field: string;
  disabled: boolean;
  registerField: (field: string, getValue: () => string) => () => void;
};

const MissingFieldInput = ({
  field,
  disabled,
  registerField,
}: MissingFieldInputProps) => {
  const fieldInput = useUncontrolledTextInput();
  const label = formatFieldLabel(field);

  useEffect(
    () => registerField(field, fieldInput.getValue),
    [field, fieldInput.getValue, registerField]
  );

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{label}</Text>
      <TextInput
        key={fieldInput.inputKey}
        placeholder={label}
        defaultValue={fieldInput.defaultValue}
        onChangeText={fieldInput.handleChangeText}
        autoCapitalize="none"
        editable={!disabled}
      />
    </View>
  );
};

export default function ContinueSignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { signOut } = useAuth();
  const { replace } = useRouter();
  const signInToInstant = useInstantSignIn();
  const fieldGettersRef = useRef<Record<string, () => string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishingSignIn, setIsFinishingSignIn] = useState(false);
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const isLoaded = fetchStatus === 'idle';

  const missingFields = useMemo(
    () => signUp?.missingFields ?? [],
    [signUp?.missingFields]
  );
  const textMissingFields = useMemo(
    () => missingFields.filter(field => field !== 'legal_accepted'),
    [missingFields]
  );
  const hasLegalAcceptedRequirement =
    missingFields.includes('legal_accepted');
  const isBusy = isSubmitting || isFinishingSignIn || fetchStatus === 'fetching';
  const canSubmit = !isBusy && (!hasLegalAcceptedRequirement || legalAccepted);

  useEffect(() => {
    if (!isLoaded) return;
    if (!signUp?.id) {
      replace('/(auth)');
    }
  }, [isLoaded, replace, signUp?.id]);

  const registerField = useCallback((field: string, getValue: () => string) => {
    fieldGettersRef.current[field] = getValue;

    return () => {
      delete fieldGettersRef.current[field];
    };
  }, []);

  const resetToSignedOutState = async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  };

  const getLatestSignUpErrorMessage = () =>
    errors.fields.firstName?.message ??
    errors.fields.lastName?.message ??
    errors.fields.username?.message ??
    errors.global?.[0]?.longMessage ??
    errors.global?.[0]?.message ??
    null;

  const finishInstantSignIn = async () => {
    setIsFinishingSignIn(true);

    try {
      await signInToInstant();
      await initializeDefaultGroceryList();
      setBridgeFailed(false);
      replace('/(tabs)', { withAnchor: true });
    } catch (error) {
      // Clerk sign-up already finalized. A transient Instant bridge timeout
      // should not tear down the Clerk session — keep it and let the user
      // retry the bridge.
      if (error instanceof InstantBridgeError) {
        setBridgeFailed(true);
        toast.error(
          'Network issue finishing sign-in. Check your connection and tap Retry.'
        );
        return;
      }

      await resetToSignedOutState();
      toast.error('We could not finish signing you in. Please try again.');
    } finally {
      setIsFinishingSignIn(false);
    }
  };

  const completeSignUp = async () => {
    if (!signUp) return;

    await runWithEmailAuthCompletion(async () => {
      try {
        const { error } = await signUp.finalize();
        throwIfFutureError(error);
      } catch (error) {
        if (!isClerkMissingSessionError(error)) {
          throw error;
        }

        // eslint-disable-next-line no-console
        console.warn(
          '[continue-sign-up] Clerk finalize reported a stale session',
          getClerkErrorPayload(error)
        );
      }

      await finishInstantSignIn();
    });
  };

  const onRetryFinishPress = async () => {
    await runWithEmailAuthCompletion(finishInstantSignIn);
  };

  const handleSubmit = async () => {
    if (!isLoaded || !signUp?.id) return;

    if (missingFields.length === 0) {
      toast.error('No additional details are required.');
      return;
    }

    if (hasLegalAcceptedRequirement && !legalAccepted) {
      toast.error('Please accept the terms to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = textMissingFields.reduce<
        Record<string, string | boolean>
      >(
        (values, field) => {
          values[getSignUpUpdateField(field)] =
            fieldGettersRef.current[field]?.() ?? '';
          return values;
        },
        {}
      );

      if (hasLegalAcceptedRequirement) {
        formData.legalAccepted = true;
      }

      const { error } = await signUp.update(
        formData as Parameters<typeof signUp.update>[0]
      );
      throwIfFutureError(error);

      if (signUp.status === 'complete') {
        await completeSignUp();
        return;
      }

      if (signUp.status === 'missing_requirements') {
        toast.error('Please complete all required fields.');
        return;
      }

      toast.error('Sign up incomplete. Please try again.');
    } catch (err: unknown) {
      toast.error(
        getSafeClerkErrorMessage(err) ??
          getLatestSignUpErrorMessage() ??
          'Failed to continue sign up.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Continue Sign Up
            </Text>
            <Text variant="muted" className="text-center">
              Provide a few more details to finish
            </Text>
          </View>

          {bridgeFailed ? (
            <View className="gap-4">
              <Text variant="muted" className="text-center">
                We created your account but couldn&apos;t finish connecting.
                Check your internet connection and try again.
              </Text>
              <Button
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
          ) : missingFields.length === 0 ? (
            <View className="gap-4">
              <Text variant="muted" className="text-center">
                No additional details are required. Please return to the welcome
                screen.
              </Text>
              <Button onPress={() => replace('/(auth)')}>
                <Text>Back to Welcome</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              {textMissingFields.map(field => (
                <MissingFieldInput
                  key={field}
                  field={field}
                  disabled={isBusy}
                  registerField={registerField}
                />
              ))}

              {hasLegalAcceptedRequirement ? (
                <View className="flex-row items-center gap-3">
                  <Switch
                    value={legalAccepted}
                    onValueChange={setLegalAccepted}
                    disabled={isBusy}
                  />
                  <Text className="flex-1 text-sm">
                    I agree to the{' '}
                    <LegalLink document="terms" label="Terms of Service" /> and{' '}
                    <LegalLink document="privacy" label="Privacy Policy" />.
                  </Text>
                </View>
              ) : null}

              <Button
                onPress={handleSubmit}
                disabled={!canSubmit}
                size="lg"
                className="mt-2"
              >
                {isBusy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text>Continue</Text>
                )}
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
