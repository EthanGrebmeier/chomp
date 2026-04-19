import { Slot } from 'expo-router';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';

import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  // Preload all essential queries for instant availability. Auth-based
  // redirects are handled centrally by `InstantAuthHandler` so protected
  // routes outside of `(tabs)` (e.g. sheets) are covered by the same rule.
  useRecipes();
  useGroceryLists();

  return <Slot />;
}
