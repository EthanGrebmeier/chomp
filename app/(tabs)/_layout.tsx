import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { useRecipes } from '../../features/recipes/hooks';

function TabsContent() {
  // Preload all essential queries for instant availability
  useRecipes();
  useGroceryLists();

  return (
    <>
      <Slot />
    </>
  );
}

export default function Layout() {
  const {
    hasAppAccess,
    hasInstantEmailSession,
    isReconciled,
    isSignedInWithClerk,
    shouldBlockAuthUi,
  } = useInstantAuthState();

  if (shouldBlockAuthUi || !isReconciled) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isSignedInWithClerk && !hasInstantEmailSession) {
    return <Redirect href="/(auth)" />;
  }

  if (!hasAppAccess) {
    return <Redirect href="/(auth)" />;
  }

  return <TabsContent />;
}
