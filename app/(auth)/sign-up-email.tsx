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

import { BackButton } from '../../components/ui/back-button';

export default function SignUpEmail() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

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
        // Email verification is required
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        setPendingVerification(true);
        toast.success('Verification code sent to your email');
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
            toast.error(
              'This password has been compromised. Please use a different one'
            );
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

  const onVerifyPress = async () => {
    if (!isLoaded) {
      return;
    }

    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        toast.error('Verification incomplete. Please try again.');
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
            error.code === 'form_code_incorrect' ||
            error.code === 'verification_failed'
          ) {
            toast.error('Invalid verification code');
          } else if (error.code === 'form_param_max_length_exceeded') {
            toast.error('Verification code is too long');
          } else {
            toast.error(error.message ?? 'Failed to verify');
          }
        } else {
          toast.error('Failed to verify. Please try again.');
        }
      } else {
        toast.error('Failed to verify. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      toast.success('Verification code resent');
    } catch {
      toast.error('Failed to resend code. Please try again.');
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
      <View className="top-safe absolute left-4 ">
        <BackButton />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {!pendingVerification ? (
            <>
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
            </>
          ) : (
            <>
              <View className="mb-8">
                <Text variant="h1" className="mb-2">
                  Verify Email
                </Text>
                <Text variant="muted" className="text-center">
                  Enter the verification code sent to {email}
                </Text>
              </View>

              <View className="gap-4">
                <TextInput
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  editable={!isVerifying}
                />

                <Button
                  onPress={onVerifyPress}
                  disabled={isVerifying}
                  size="lg"
                  className="mt-4"
                >
                  {isVerifying ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Verify Email</Text>
                  )}
                </Button>

                <View className="mt-6 flex-row items-center justify-center">
                  <Text variant="muted" className="text-sm">
                    Didn&apos;t receive a code?{' '}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={onResendCode}
                    disabled={isVerifying}
                  >
                    <Text className="text-sm font-semibold">Resend</Text>
                  </Button>
                </View>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
