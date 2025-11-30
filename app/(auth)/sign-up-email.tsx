import { useSignUp } from '@clerk/clerk-expo';
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

export default function SignUpEmail() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSigningUp(true);

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        // Handle other statuses - email verification might be required
        toast.error('Sign up incomplete. Please try again.');
      }
    } catch (err: unknown) {
      // Handle specific error cases
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkError = err as {
          errors: { code: string; message: string }[];
        };
        if (clerkError.errors && clerkError.errors.length > 0) {
          const error = clerkError.errors[0];
          if (error.code === 'form_identifier_exists') {
            toast.error('An account with this email already exists');
          } else if (error.code === 'form_password_pwned') {
            toast.error('This password has been compromised. Please use a different one');
          } else if (error.code === 'form_password_length_too_short') {
            toast.error('Password is too short');
          } else if (error.code === 'form_param_format_invalid') {
            toast.error('Invalid email format');
          } else {
            toast.error(error.message ?? 'Failed to sign up');
          }
        } else {
          toast.error('Failed to sign up. Please try again.');
        }
      } else {
        toast.error('Failed to sign up. Please try again.');
      }
    } finally {
      setIsSigningUp(false);
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
              Create Account
            </Text>
            <Text variant="muted" className="text-center">
              Sign up to get started
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
              editable={!isSigningUp}
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!isSigningUp}
            />

            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!isSigningUp}
            />

            <Button
              onPress={onSignUpPress}
              disabled={isSigningUp}
              size="lg"
              className="mt-4"
            >
              {isSigningUp ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text>Sign Up</Text>
              )}
            </Button>

            <View className="mt-6 flex-row items-center justify-center">
              <Text variant="muted" className="text-sm">
                Already have an account?{' '}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/sign-in-email')}
                disabled={isSigningUp}
              >
                <Text className="text-sm font-semibold">Sign In</Text>
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

