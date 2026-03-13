import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useContinueAsGuest } from '@/lib/instant/use-continue-as-guest';

const appIcon = require('../../assets/images/icon.png');

export default function Welcome() {
  const router = useRouter();
  const continueAsGuest = useContinueAsGuest();
  const [isContinuingAsGuest, setIsContinuingAsGuest] = useState(false);

  const handleContinueAsGuest = async () => {
    setIsContinuingAsGuest(true);

    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch {
      toast.error('Failed to continue as a guest. Please try again.');
    } finally {
      setIsContinuingAsGuest(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pb-8 pt-4">
        <View className="flex-[4] items-center justify-center ">
          <Image
            source={appIcon}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
          <Text className="text-center text-2xl font-bold">
            Welcome to Chomp!
          </Text>
        </View>

        <View className="flex-[2] justify-end gap-4">
          <Button
            size="lg"
            onPress={() => router.push('/(auth)/sign-in-email')}
            disabled={isContinuingAsGuest}
          >
            <Text>Sign In</Text>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onPress={handleContinueAsGuest}
            disabled={isContinuingAsGuest}
          >
            {isContinuingAsGuest ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Continue as Guest</Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
