import { Redirect, Slot } from 'expo-router';

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
  const { hasAppAccess, isReconciled } = useInstantAuthState();

  if (isReconciled && !hasAppAccess) {
    return <Redirect href="/(auth)" />;
  }

  return <TabsContent />;
}
