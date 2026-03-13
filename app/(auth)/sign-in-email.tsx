import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { SocialButtons } from '@/components/auth/social-buttons';
import { TextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';

export default function SignInEmail() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const router = useRouter();
  const signInToInstant = useInstantSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isBusy = isSigningIn;

  const resetToSignedOutState = async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSigningIn(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        try {
          await signInToInstant();
          router.replace('/(tabs)');
        } catch {
          await resetToSignedOutState();
          toast.error('We could not finish signing you in. Please try again.');
        }
      } else {
        // Handle other statuses if needed
        toast.error('Sign in incomplete. Please try again.');
      }
    } catch (err: unknown) {
      // Handle specific error cases
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkError = err as {
          errors: { code: string; message: string }[];
        };
        if (clerkError.errors && clerkError.errors.length > 0) {
          const error = clerkError.errors[0];
          if (
            error.code === 'form_password_incorrect' ||
            error.code === 'form_identifier_not_found'
          ) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message ?? 'Failed to sign in');
          }
        } else {
          toast.error('Failed to sign in. Please try again.');
        }
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
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
      <View className="top-safe absolute left-4">
        <BackButton />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8 gap-2">
            <Text variant="h1">Sign In</Text>
            <Text variant="muted" className="text-center">
              Continue with your account to sync across devices.
            </Text>
          </View>

          <View className="gap-4">
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isBusy}
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              editable={!isBusy}
            />

            <Button
              onPress={onSignInPress}
              disabled={isBusy}
              size="lg"
              className="mt-4"
            >
              {isSigningIn ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text>Sign In</Text>
              )}
            </Button>

            <SocialButtons disabled={isBusy} type="sign-in" />
            <View className="mt-6 flex-row items-center justify-center">
              <Text variant="muted" className="text-sm">
                Don&apos;t have an account?{' '}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/sign-up-email')}
                disabled={isBusy}
              >
                <Text className="text-sm font-semibold">Sign Up</Text>
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
