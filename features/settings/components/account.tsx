import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { db } from '../../../lib/instant';

const Account = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      await db.auth.signOut();
    } catch (error) {
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
          onPress={() => router.push('/(auth)/sign-up-email')}
          className="w-full"
        >
          <Text> Create an Account </Text>
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in-email')}
          className="w-full"
        >
          <Text> Sign in with email </Text>
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
