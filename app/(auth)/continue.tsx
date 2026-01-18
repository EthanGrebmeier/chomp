import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

const formatFieldLabel = (field: string) =>
  field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function ContinueSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingFields = useMemo(
    () => signUp?.missingFields ?? [],
    [signUp?.missingFields]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!signUp?.id) {
      router.replace('/(auth)/sign-in-email');
    }
  }, [isLoaded, router, signUp?.id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!isLoaded || !signUp?.id) return;

    if (missingFields.length === 0) {
      toast.error('No additional details are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp.update(formData);
      if (result?.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/');
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
                No additional details are required. Please return to sign in.
              </Text>
              <Button onPress={() => router.replace('/(auth)/sign-in-email')}>
                <Text>Back to Sign In</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              {missingFields.map((field) => (
                <View key={field} className="gap-2">
                  <Text className="text-sm font-medium">
                    {formatFieldLabel(field)}
                  </Text>
                  <TextInput
                    placeholder={formatFieldLabel(field)}
                    value={formData[field] || ''}
                    onChangeText={(value) => handleChange(field, value)}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                </View>
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
