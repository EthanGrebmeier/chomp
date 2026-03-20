import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import {
  consumeManualSignOutIntent,
  markManualSignOutIntent,
} from '../../../lib/clerk/signout-intent';

const Account = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleNavigateToSignIn = () => {
    router.dismissTo('/(auth)/sign-in');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      markManualSignOutIntent();
      await signOut();
      router.dismissTo('/(auth)');
    } catch {
      consumeManualSignOutIntent();
      toast.error('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  if (!user?.primaryEmailAddress) {
    return (
      <View className="gap-4 p-4">
        <View>
          <Text className="text-lg font-medium leading-5">Account</Text>
          <Text className="text-sm text-muted-foreground">
            Signed in as a guest
          </Text>
        </View>
        <View className="gap-2">
          <Button
            variant="secondary"
            onPress={handleNavigateToSignIn}
            className="w-full"
            size="lg"
          >
            <Text>Create Account</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4 p-4">
      <View>
        <Text variant="muted" className="mb-1">
          Account
        </Text>
        <Text className="font-medium">
          {user.primaryEmailAddress.emailAddress}
        </Text>
      </View>
      <Button
        variant="destructive"
        onPress={handleSignOut}
        disabled={isSigningOut}
        className="w-full"
        size="lg"
      >
        {isSigningOut ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text>Sign Out</Text>
        )}
      </Button>
    </View>
  );
};

export default Account;
