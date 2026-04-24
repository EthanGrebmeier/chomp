import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { WelcomeGraphic } from '@/components/branding/welcome-graphic';
import { Button } from '@/components/ui/button';
import { useContinueAsGuest } from '@/lib/instant/use-continue-as-guest';
import { navigation } from '@/lib/navigation';

import { Text } from '../../components/ui/text';

export default function Welcome() {
  const router = useRouter();
  const continueAsGuest = useContinueAsGuest();
  const [isContinuingAsGuest, setIsContinuingAsGuest] = useState(false);

  const handleContinueAsGuest = async () => {
    setIsContinuingAsGuest(true);

    try {
      const listId = await continueAsGuest();
      router.replace(navigation.goToList(listId ?? undefined));
    } catch {
      toast.error('Failed to continue as a guest. Please try again.');
      setIsContinuingAsGuest(false);
    }
  };

  return (
    <SafeAreaView className="h-full bg-background">
      <View className="mt-12 flex-1 justify-between  px-6">
        <View className="items-center justify-start ">
          <Text className="font-averia-serif-libre text-center uppercase text-primary">
            Welcome to
          </Text>
          <Text className="font-jaro-regular text-center text-[120px] uppercase leading-none text-primary">
            Chomp
          </Text>
        </View>
        <View className="w-full flex-1 translate-x-[-12px] translate-y-[-18px] items-center justify-center">
          <WelcomeGraphic />
        </View>

        <View className=" justify-end gap-2">
          <Button
            size="xl"
            className="w-full"
            onPress={() => router.push('/(auth)/sign-in')}
            disabled={isContinuingAsGuest}
          >
            <Text className="font-bold uppercase ">Sign In</Text>
          </Button>

          <Button
            variant="ghost"
            size="xl"
            onPress={handleContinueAsGuest}
            disabled={isContinuingAsGuest}
          >
            {isContinuingAsGuest ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold uppercase">
                Continue as A Guest
              </Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
