import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { LegalConsent } from '@/components/auth/legal-consent';
import { WelcomeGraphic } from '@/components/branding/welcome-graphic';
import { Button } from '@/components/ui/button';
import { useContinueAsGuest } from '@/lib/instant/use-continue-as-guest';
import { navigation } from '@/lib/navigation';

import { Text } from '../../components/ui/text';
import { cn } from '../../lib/utils';

export default function Welcome() {
  const router = useRouter();
  const continueAsGuest = useContinueAsGuest();
  const [isContinuingAsGuest, setIsContinuingAsGuest] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const colorScheme = useColorScheme();

  const handleContinueAsGuest = async () => {
    setIsContinuingAsGuest(true);

    try {
      const listId = await continueAsGuest();
      router.replace(navigation.goToList(listId ?? undefined));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[guest-continuation] welcome screen failed', error);
      toast.error('Failed to continue as a guest. Please try again.');
      setIsContinuingAsGuest(false);
    }
  };

  return (
    <SafeAreaView
      className={cn(
        'h-full bg-background',
        colorScheme === 'dark' ? 'bg-[#2020B1]' : 'bg-background'
      )}
    >
      <View className="mt-12 flex-1 justify-between  px-6">
        <View className="items-center justify-start gap-2">
          <Text
            className={cn(
              'text-center text-[88px] font-bold uppercase leading-none tracking-tight',
              colorScheme === 'dark' ? 'text-foreground' : 'text-primary'
            )}
          >
            Chomp
          </Text>
        </View>
        <View className="w-full translate-x-[-12px] translate-y-[-18px] items-center justify-center">
          <WelcomeGraphic width={300} height={300} />
        </View>
        <View className=" justify-end gap-2">
          <Button
            size="xl"
            variant="default"
            className="w-full"
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text>Sign in</Text>
          </Button>

          <Button
            variant="ghost"
            size="xl"
            onPress={handleContinueAsGuest}
            disabled={isSocialLoading || isContinuingAsGuest}
          >
            {isContinuingAsGuest ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Continue as a Guest</Text>
            )}
          </Button>

          <LegalConsent className="mt-2 px-4 text-foreground/80" />
        </View>
      </View>
    </SafeAreaView>
  );
}
