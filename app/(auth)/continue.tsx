import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';

const formatFieldLabel = (field: string) =>
  field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

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

  useEffect(() => registerField(field, fieldInput.getValue), [
    field,
    fieldInput.getValue,
    registerField,
  ]);

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
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signOut } = useAuth();
  const router = useRouter();
  const signInToInstant = useInstantSignIn();
  const fieldGettersRef = useRef<Record<string, () => string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingFields = useMemo(
    () => signUp?.missingFields ?? [],
    [signUp?.missingFields]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!signUp?.id) {
      router.replace('/(auth)');
    }
  }, [isLoaded, router, signUp?.id]);

  const registerField = useCallback(
    (field: string, getValue: () => string) => {
      fieldGettersRef.current[field] = getValue;

      return () => {
        delete fieldGettersRef.current[field];
      };
    },
    []
  );

  const handleSubmit = async () => {
    if (!isLoaded || !signUp?.id) return;

    if (missingFields.length === 0) {
      toast.error('No additional details are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = missingFields.reduce<Record<string, string>>(
        (values, field) => {
          values[field] = fieldGettersRef.current[field]?.() ?? '';
          return values;
        },
        {}
      );
      const result = await signUp.update(formData);
      if (result?.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        try {
          await signInToInstant();
          await initializeDefaultGroceryList();
          router.replace('/(tabs)');
        } catch {
          try {
            await signOut();
          } catch {
            // Best effort: keep auth layers aligned when Instant sign-in fails.
          }
          toast.error('We could not finish signing you in. Please try again.');
        }
        return;
      }

      if (result?.status === 'missing_requirements') {
        toast.error('Please complete all required fields.');
        return;
      }

      toast.error('Sign up incomplete. Please try again.');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkError = err as {
          errors: { code: string; message: string }[];
        };
        const error = clerkError.errors?.[0];
        toast.error(error?.message ?? 'Failed to continue sign up.');
      } else {
        toast.error('Failed to continue sign up.');
      }
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

          {missingFields.length === 0 ? (
            <View className="gap-4">
              <Text variant="muted" className="text-center">
                No additional details are required. Please return to the welcome screen.
              </Text>
              <Button onPress={() => router.replace('/(auth)')}>
                <Text>Back to Welcome</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              {missingFields.map((field) => (
                <MissingFieldInput
                  key={field}
                  field={field}
                  disabled={isSubmitting}
                  registerField={registerField}
                />
              ))}

              <Button
                onPress={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="mt-2"
              >
                {isSubmitting ? (
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
