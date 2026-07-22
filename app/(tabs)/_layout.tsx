import { Slot } from 'expo-router';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { useRecipes } from '../../features/recipes/hooks';

const AuthenticatedQueryPreloader = () => {
  // Preload all essential queries for instant availability. Auth-based
  // redirects are handled centrally by `InstantAuthHandler` so protected
  // routes outside of `(tabs)` (e.g. sheets) are covered by the same rule.
  useRecipes();
  useGroceryLists();

  return null;
};

export default function Layout() {
  const { hasAppAccess } = useInstantAuthState();

  return (
    <>
      {hasAppAccess ? <AuthenticatedQueryPreloader /> : null}
      <Slot />
    </>
  );
}
