import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { LegalConsent } from '@/components/auth/legal-consent';
import { SocialButtons } from '@/components/auth/social-buttons';
import { WelcomeGraphic } from '@/components/branding/welcome-graphic';
import { BareTextInput } from '@/components/text-input';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';

import { Text } from '../../components/ui/text';

export default function SignIn() {
  const router = useRouter();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const emailInput = useUncontrolledTextInput();

  const onContinueWithEmail = () => {
    const email = emailInput.getValue().trim();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    router.push({
      pathname: '/(auth)/sign-in-email',
      params: { email },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4">
        <BackButton />
      </View>

      <Pressable
        className="flex-1"
        accessible={false}
        onPress={() => Keyboard.dismiss()}
      >
        <View className="w-full flex-1 px-4 pt-8">
          <View className="w-full gap-4">
            <View className="w-full items-center gap-2 text-center">
              <View className="w-full translate-x-[-6px] translate-y-[-18px] items-center justify-center">
                <WelcomeGraphic width={100} height={100} />
              </View>
              <Text variant="h2">Log In</Text>
              <Text variant="muted">
                Enter your email to continue with a verification code
              </Text>
            </View>

            <View className="gap-4 ">
              <View className="my-4 rounded-2xl border border-border bg-input px-4 py-3">
                <BareTextInput
                  placeholder="Email"
                  onChangeText={emailInput.handleChangeText}
                  onSubmitEditing={onContinueWithEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  className="text-xl"
                />
              </View>

              <Button
                size="xl"
                variant="default"
                className="w-full"
                disabled={isSocialLoading}
                onPress={onContinueWithEmail}
              >
                <Text>Continue</Text>
              </Button>
            </View>
          </View>

          <View className="w-full flex-1 items-center gap-3">
            <View className="w-full flex-1">
              <View className="w-full flex-row items-center gap-3  py-6">
                <View className="h-px flex-1 bg-border" />
                <Text
                  variant="muted"
                  className="text-sm font-semibold uppercase"
                >
                  or
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <View className="w-full gap-2">
                <SocialButtons
                  variant="secondary"
                  onLoadingChange={setIsSocialLoading}
                />
              </View>
            </View>

            <LegalConsent className="mt-2 px-4" action="signing in" />
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
