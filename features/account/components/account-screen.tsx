import { useAuth, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import {
  consumeManualSignOutIntent,
  markManualSignOutIntent,
} from '../../../lib/clerk/signout-intent';
import { db } from '../../../lib/instant';
import { useInstantAuthState } from '../../../lib/instant/use-clerk-auth';
import { useDeleteAccount } from '../hooks/use-delete-account';

export const AccountScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { user: instantUser } = db.useAuth();
  const { isReconciled, hasInstantEmailSession } = useInstantAuthState();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      markManualSignOutIntent();
      queryClient.clear();
      await Promise.allSettled([signOut(), db.auth.signOut()]);
      // Close the settings/account modal stack; InstantAuthHandler routes back
      // to the welcome screen once the session is gone.
      router.dismissAll();
    } catch {
      consumeManualSignOutIntent();
      toast.error('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your data, including lists, recipes, saved items, and meal plans. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount(undefined, {
              onError: error => {
                toast.error(
                  error.message || 'Failed to delete account. Please try again.'
                );
              },
            });
          },
        },
      ]
    );
  };

  if (!isReconciled) {
    return (
      <View className="flex-1 p-4">
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasInstantEmailSession) {
    return (
      <View className="flex-1 p-4">
        <Text variant="muted">You are not signed in.</Text>
      </View>
    );
  }

  const email =
    user?.primaryEmailAddress?.emailAddress ?? instantUser?.email ?? '';
  const isBusy = isSigningOut || isDeleting;

  return (
    <View className="flex-1 justify-between p-4">
      <View>
        <Text variant="muted" className="mb-1">
          Email
        </Text>
        <Text className="font-medium">{email}</Text>
      </View>

      <View className="pb-safe gap-3">
        <Button
          variant="secondary"
          onPress={handleSignOut}
          disabled={isBusy}
          className="w-full"
          size="lg"
        >
          {isSigningOut ? <ActivityIndicator /> : <Text>Sign Out</Text>}
        </Button>

        <Button
          variant="destructive"
          onPress={handleDeleteAccount}
          disabled={isBusy}
          className="w-full"
          size="lg"
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text>Delete Account</Text>
          )}
        </Button>
      </View>
    </View>
  );
};
