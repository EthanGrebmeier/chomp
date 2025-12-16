import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { ChevronRightIcon, BookmarkIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { toast } from 'sonner-native';

import { Heading } from '@/components/text/heading';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { db } from '../../lib/instant';

export default function Settings() {
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
      router.replace('/(auth)/sign-in-email');
    }
  };

  const handleNavigateToSavedItems = () => {
    router.push('/saved-items');
  };

  return (
    <View className="pt-safe flex-1 bg-background">
      <View className="px-4">
        <Heading>Settings</Heading>
      </View>
      <View className="flex-1 px-4 pt-6">
        {user?.primaryEmailAddress && (
          <View className="mb-8 rounded-xl bg-muted/50 p-4">
            <Text variant="muted" className="mb-1">
              Signed in as
            </Text>
            <Text className="font-medium">
              {user.primaryEmailAddress.emailAddress}
            </Text>
          </View>
        )}

        {/* Settings Menu */}
        <View className="mb-8">
          <Pressable
            onPress={handleNavigateToSavedItems}
            className="flex-row items-center justify-between rounded-xl bg-muted/50 p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <Icon
                as={BookmarkIcon}
                size={20}
                className="text-muted-foreground"
              />
              <Text className="font-medium">My Saved Items</Text>
            </View>
            <Icon
              as={ChevronRightIcon}
              size={20}
              className="text-muted-foreground"
            />
          </Pressable>
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
    </View>
  );
}
