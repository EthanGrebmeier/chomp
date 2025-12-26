import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useJoinGroceryListByCode } from '@/features/grocery-lists/instant/useJoinGroceryListByCode';
import { db } from '@/lib/instant';
import { navigation } from '@/lib/navigation';

type Status = 'checking' | 'joining' | 'error' | 'success';

export default function JoinListByCode() {
  const { joinCode } = useLocalSearchParams<{ joinCode: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();
  const connectionStatus = db.useConnectionStatus();
  const { data: lists, isLoading: listsLoading } = useGroceryLists();
  const joinGroceryListByCode = useJoinGroceryListByCode();

  const [status, setStatus] = useState<Status>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check if user is authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to auth if not authenticated
      router.replace('/(auth)/sign-in-email');
      return;
    }
  }, [user, authLoading, router]);

  // Check connection status and user access
  useEffect(() => {
    if (authLoading || listsLoading || !user || !joinCode) return;

    // Check if InstantDB is connected
    // Allow 'connecting' and 'opened' states as they indicate connection in progress
    // Only show error for 'closed' or 'errored' states
    if (connectionStatus === 'closed' || connectionStatus === 'errored') {
      setStatus('error');
      setErrorMessage(
        'You are offline. Please check your internet connection and try again.'
      );
      return;
    }

    // Wait for authentication if still connecting
    if (connectionStatus !== 'authenticated') {
      return;
    }

    // Check if user already has access to this list
    const listWithCode = lists?.grocery_lists.find(
      list => list.joinCode === joinCode
    );

    if (listWithCode) {
      // User already has access, navigate to the list
      setStatus('success');
      router.replace(navigation.goToList(listWithCode.id));
      return;
    }

    // User doesn't have access, attempt to join
    const attemptJoin = async () => {
      setStatus('joining');
      const result = await joinGroceryListByCode(joinCode);

      if (result.success) {
        setStatus('success');
        router.replace(navigation.goToList(result.listId));
      } else {
        setStatus('error');
        setErrorMessage(result.error);
      }
    };

    attemptJoin();
  }, [
    user,
    authLoading,
    listsLoading,
    lists,
    joinCode,
    connectionStatus,
    joinGroceryListByCode,
    router,
  ]);

  const handleGoToLists = () => {
    router.replace(navigation.goToList());
  };

  // Loading state
  if (status === 'checking' || status === 'joining' || authLoading || listsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-lg text-muted-foreground">
          {status === 'joining' ? 'Joining list...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-2 text-center text-2xl font-bold text-foreground">
          Unable to Join List
        </Text>
        <Text className="mb-8 text-center text-base text-muted-foreground">
          {errorMessage}
        </Text>
        <Button onPress={handleGoToLists} className="w-full max-w-sm">
          <Text>Go to Lists</Text>
        </Button>
      </View>
    );
  }

  // Success state (should redirect, but show loading just in case)
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" />
    </View>
  );
}

