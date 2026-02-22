import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';

const Account = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleNavigateToSignUp = () => {
    router.dismissTo('/(auth)/sign-up-email');
  };

  const handleNavigateToSignIn = () => {
    router.dismissTo('/(auth)/sign-in-email');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user?.primaryEmailAddress) {
    return (
      <View className="gap-4 rounded-xl bg-muted/50 p-4">
        <View>
          <Text className="mb-1 text-lg font-medium">Account</Text>
          <Text className="text-sm text-muted-foreground">
            Signed in as a guest
          </Text>
        </View>
        <Button
          variant="default"
          onPress={handleNavigateToSignUp}
          className="w-full"
        >
          <Text>Create an Account</Text>
        </Button>
        <Button
          variant="secondary"
          onPress={handleNavigateToSignIn}
          className="w-full"
        >
          <Text>Sign In</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-xl bg-muted/50 p-4">
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
