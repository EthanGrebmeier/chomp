import { useRouter } from 'expo-router';
import { MailIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocialButtons } from '@/components/auth/social-buttons';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';

import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';

export default function SignIn() {
  const router = useRouter();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 gap-8 bg-background">
      <View className="px-4">
        <BackButton />
      </View>

      <View className="w-full flex-1 items-center justify-center gap-20 px-4">
        <View className="w-full items-center justify-center">
          <Text variant="h1" className="uppercase text-primary">
            Sign In
          </Text>
          <Text className="font-averia-serif-libre text-xl">
            Choose how you want to continue
          </Text>
        </View>

        <View className="w-full items-center justify-end gap-4 pb-12">
          <SocialButtons onLoadingChange={setIsSocialLoading} />
          <Button
            size="xl"
            className="w-full"
            disabled={isSocialLoading}
            icon={
              <Icon
                className="text-secondary-foreground"
                as={MailIcon}
                strokeWidth={2.75}
                size={16}
              />
            }
            onPress={() => router.push('/(auth)/sign-in-email')}
          >
            <Text>Sign in with Email Code</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
