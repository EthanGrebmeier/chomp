import { useSignIn } from '@clerk/clerk-expo';
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

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SignInEmail() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

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
        router.replace('/');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Welcome Back
            </Text>
            <Text variant="muted" className="text-center">
              Sign in to continue
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
              editable={!isSigningIn}
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              editable={!isSigningIn}
            />

            <Button
              onPress={onSignInPress}
              disabled={isSigningIn}
              size="lg"
              className="mt-4"
            >
              {isSigningIn ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text>Sign In</Text>
              )}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
